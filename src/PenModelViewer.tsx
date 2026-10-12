import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

type PenModelViewerProps = {
  className?: string
  interactive?: boolean
  label?: string
}

type DragPoint = { pointerId: number; x: number; y: number }

const threeModuleUrl = 'https://esm.sh/three@0.180.0'
const svgRendererModuleUrl = 'https://esm.sh/three@0.180.0/addons/renderers/SVGRenderer.js'
const gltfLoaderModuleUrl = 'https://esm.sh/three@0.180.0/addons/loaders/GLTFLoader.js'
const penModelUrl = 'https://www.innerscene.com/api/library/nib-pen-writing-instrument-f4ed7ea9/download'

let penBinaryPromise: Promise<ArrayBuffer> | null = null

function loadPenBinary() {
  if (!penBinaryPromise) {
    penBinaryPromise = fetch(penModelUrl)
      .then(response => {
        if (!response.ok) throw new Error(`O modelo respondeu com HTTP ${response.status}`)
        return response.arrayBuffer()
      })
      .catch(error => {
        penBinaryPromise = null
        throw error
      })
  }
  return penBinaryPromise
}

/** SVGRenderer draws real mesh geometry without creating a WebGL context. */
function makeSoftwareMaterial(material: any, THREE: any) {
  const name = String(material?.name ?? '').toLowerCase()
  const color = material?.color?.clone ? material.color.clone() : new THREE.Color('#2a2b30')

  // SVGRenderer cannot draw embedded PBR textures, so retain real geometry and
  // choose a restrained graphite/bronze palette for the source model's materials.
  if (/bronze|brass|gold|copper|nib/.test(name)) {
    color.set('#b18a58')
  } else if (/silver|chrome|steel|clip|metal/.test(name)) {
    color.set('#b9b7b0')
  } else if (/graphite|black|barrel|body|cap|grip|dark|pen/.test(name)) {
    color.set('#292b30')
  } else if (material?.map && color.r > 0.86 && color.g > 0.86 && color.b > 0.86) {
    color.set('#303137')
  }

  return new THREE.MeshLambertMaterial({
    color,
    opacity: typeof material?.opacity === 'number' ? material.opacity : 1,
    transparent: Boolean(material?.transparent),
    side: material?.side ?? THREE.FrontSide,
  })
}

export function PenModelViewer({
  className = '',
  interactive = false,
  label = 'Modelo 3D de uma caneta-tinteiro',
}: PenModelViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const modelRootRef = useRef<any>(null)
  const drawRef = useRef<(() => void) | null>(null)
  const dragRef = useRef<DragPoint | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let disposed = false
    let renderer: any = null
    let camera: any = null
    let scene: any = null
    let resizeObserver: ResizeObserver | null = null
    let previousSize = { width: 0, height: 0 }

    const draw = () => {
      if (disposed || !renderer || !camera || !scene || !mount) return
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      if (width !== previousSize.width || height !== previousSize.height) {
        previousSize = { width, height }
        renderer.setSize(width, height)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
      renderer.render(scene, camera)
      renderer.domElement.style.backgroundColor = 'transparent'
    }

    drawRef.current = draw

    const initialise = async () => {
      try {
        const [threeModule, rendererModule, loaderModule] = await Promise.all([
          import(/* @vite-ignore */ threeModuleUrl),
          import(/* @vite-ignore */ svgRendererModuleUrl),
          import(/* @vite-ignore */ gltfLoaderModuleUrl),
        ])
        if (disposed) return

        const THREE = threeModule as any
        const SVGRenderer = (rendererModule as any).SVGRenderer
        const GLTFLoader = (loaderModule as any).GLTFLoader
        const bytes = await loadPenBinary()
        if (disposed) return

        const gltf = await new GLTFLoader().parseAsync(bytes, '')
        if (disposed) return

        scene = new THREE.Scene()
        scene.add(new THREE.AmbientLight(0xffffff, 1.25))
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.7)
        keyLight.position.set(2.5, 3.5, 4)
        scene.add(keyLight)
        const fillLight = new THREE.DirectionalLight(0x9bacc5, 0.55)
        fillLight.position.set(-3, 1, -2)
        scene.add(fillLight)

        const pivot = new THREE.Group()
        scene.add(pivot)
        const model = gltf.scene
        model.traverse((node: any) => {
          if (!node.isMesh) return
          node.material = Array.isArray(node.material)
            ? node.material.map((item: any) => makeSoftwareMaterial(item, THREE))
            : makeSoftwareMaterial(node.material, THREE)
        })

        const bounds = new THREE.Box3().setFromObject(model)
        const center = bounds.getCenter(new THREE.Vector3())
        const size = bounds.getSize(new THREE.Vector3())
        const longestSide = Math.max(size.x, size.y, size.z)
        if (!Number.isFinite(longestSide) || longestSide <= 0) {
          throw new Error('O modelo 3D não contém uma geometria válida.')
        }
        const fitScale = 2.05 / longestSide
        model.position.sub(center.clone().multiplyScalar(fitScale))
        model.scale.multiplyScalar(fitScale)
        pivot.add(model)
        pivot.rotation.set(0.72, -0.12, -0.34)
        modelRootRef.current = pivot

        camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100)
        camera.position.set(0, 0, 4.1)
        camera.lookAt(0, 0, 0)

        renderer = new SVGRenderer()
        renderer.setQuality('low')
        renderer.setPrecision(1)
        renderer.domElement.setAttribute('role', 'img')
        renderer.domElement.setAttribute('aria-label', label)
        renderer.domElement.style.display = 'block'
        renderer.domElement.style.width = '100%'
        renderer.domElement.style.height = '100%'
        renderer.domElement.style.overflow = 'visible'
        mount.replaceChildren(renderer.domElement)

        resizeObserver = new ResizeObserver(draw)
        resizeObserver.observe(mount)
        draw()
        setStatus('ready')
      } catch (error) {
        if (!disposed) {
          console.error('Star Room: não foi possível carregar o modelo 3D da caneta.', error)
          setStatus('error')
        }
      }
    }

    void initialise()

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      dragRef.current = null
      modelRootRef.current = null
      drawRef.current = null
      mount.replaceChildren()
    }
  }, [label])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || status !== 'ready' || !modelRootRef.current) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    setIsDragging(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const previous = dragRef.current
    const root = modelRootRef.current
    if (!interactive || !previous || previous.pointerId !== event.pointerId || !root) return
    event.preventDefault()
    event.stopPropagation()
    const dx = event.clientX - previous.x
    const dy = event.clientY - previous.y
    previous.x = event.clientX
    previous.y = event.clientY
    root.rotation.y += dx * 0.009
    root.rotation.x = Math.max(-1.25, Math.min(1.25, root.rotation.x + dy * 0.008))
    drawRef.current?.()
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || dragRef.current?.pointerId !== event.pointerId) return
    event.stopPropagation()
    dragRef.current = null
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      ref={mountRef}
      className={`pen-software-viewer ${className} ${isDragging ? 'is-dragging' : ''}`.trim()}
      role={interactive ? 'application' : 'img'}
      aria-label={label}
      aria-roledescription={interactive ? 'modelo 3D interativo' : 'modelo 3D'}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={interactive ? event => event.stopPropagation() : undefined}
    >
      {status !== 'ready' && (
        <span className={`pen-software-viewer__status ${status === 'error' ? 'is-error' : ''}`} role={status === 'error' ? 'status' : undefined}>
          {status === 'loading' ? 'A carregar o modelo 3D…' : 'Não foi possível carregar o modelo 3D.'}
        </span>
      )}
      {interactive && status === 'ready' && <span className="pen-software-viewer__hint">ARRASTA PARA GIRAR</span>}
    </div>
  )
}
