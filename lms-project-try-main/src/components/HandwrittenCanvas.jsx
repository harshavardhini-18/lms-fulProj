import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import styles from './HandwrittenCanvas.module.css'

const HandwrittenCanvas = forwardRef(function HandwrittenCanvas(
  { initialScene, onSceneChange, readOnly = false, height = 520, activeTool = 'freedraw' },
  ref
) {
  const excalidrawAPIRef = useRef(null)
  const pendingSceneRef = useRef(null)

  const normalizeScene = useCallback((scene) => {
    const safeScene = scene && typeof scene === 'object' ? scene : {}
    const nextElements = Array.isArray(safeScene.elements) ? safeScene.elements : []
    const rawAppState =
      safeScene.appState && typeof safeScene.appState === 'object' ? { ...safeScene.appState } : {}
    const nextFiles = safeScene.files && typeof safeScene.files === 'object' ? safeScene.files : {}

    // Excalidraw expects collaborators to be iterable (supports forEach).
    if (rawAppState.collaborators && typeof rawAppState.collaborators.forEach !== 'function') {
      rawAppState.collaborators = []
    }

    return {
      elements: nextElements,
      appState: rawAppState,
      files: nextFiles,
    }
  }, [])

  const applySceneToApi = useCallback((api, scene, { preserveAppState = false } = {}) => {
    if (!api) return

    const safeScene = normalizeScene(scene)
    const nextElements = safeScene.elements
    const prevAppState = api.getAppState()
    const sceneAppState = safeScene.appState
    const nextAppState = sceneAppState
      ? {
          ...(preserveAppState ? prevAppState : {}),
          ...prevAppState,
          ...sceneAppState,
        }
      : prevAppState
    const nextFiles = safeScene.files

    api.updateScene({
      elements: nextElements,
      appState: {
        ...nextAppState,
        selectedElementIds: {},
        selectedGroupIds: {},
      },
      files: nextFiles,
    })
  }, [normalizeScene])

  const normalizedInitialScene = normalizeScene(initialScene)

  const handleApiReady = useCallback((api) => {
    if (api && excalidrawAPIRef.current !== api) {
      excalidrawAPIRef.current = api
      if (pendingSceneRef.current) {
        applySceneToApi(api, pendingSceneRef.current)
        pendingSceneRef.current = null
      }
    }
  }, [applySceneToApi])

  useEffect(() => {
    const excalidrawAPI = excalidrawAPIRef.current
    if (!excalidrawAPI || readOnly) return

    if (typeof excalidrawAPI.setActiveTool === 'function') {
      excalidrawAPI.setActiveTool({ type: activeTool, locked: false })
      return
    }

    const prevAppState = excalidrawAPI.getAppState()
    excalidrawAPI.updateScene({
      appState: {
        ...prevAppState,
        activeTool: {
          ...(prevAppState.activeTool || {}),
          type: activeTool,
          locked: false,
        },
      },
    })
  }, [activeTool, readOnly])

  useImperativeHandle(ref, () => {
    return {
      clearCanvas: () => {
        const excalidrawAPI = excalidrawAPIRef.current
        if (!excalidrawAPI) return
        const prevAppState = excalidrawAPI.getAppState()
        excalidrawAPI.updateScene({
          elements: [],
          appState: {
            ...prevAppState,
            selectedElementIds: {},
            selectedGroupIds: {},
          },
        })
      },
      setScene: (scene) => {
        if (readOnly) return
        const excalidrawAPI = excalidrawAPIRef.current
        if (!excalidrawAPI) {
          pendingSceneRef.current = scene
          return
        }

        applySceneToApi(excalidrawAPI, scene)
      },
      setTool: (tool) => {
        const excalidrawAPI = excalidrawAPIRef.current
        if (!excalidrawAPI || readOnly) return

        if (typeof excalidrawAPI.setActiveTool === 'function') {
          excalidrawAPI.setActiveTool({ type: tool, locked: false })
          return
        }

        const prevAppState = excalidrawAPI.getAppState()
        excalidrawAPI.updateScene({
          appState: {
            ...prevAppState,
            activeTool: {
              ...(prevAppState.activeTool || {}),
              type: tool,
              locked: false,
            },
          },
        })
      },
      getScene: () => {
        const excalidrawAPI = excalidrawAPIRef.current
        if (!excalidrawAPI) {
          return {
            elements: [],
            appState: {},
            files: {},
          }
        }

        return {
          elements: excalidrawAPI.getSceneElements().filter((element) => !element.isDeleted),
          appState: excalidrawAPI.getAppState(),
          files: excalidrawAPI.getFiles(),
        }
      },
    }
  }, [applySceneToApi, readOnly])

  return (
    <div className={`${styles.canvasShell} ${readOnly ? styles.readOnlyShell : ''}`}>
      <div className={styles.canvasViewport} style={{ height: `${height}px` }}>
        <Excalidraw
          excalidrawAPI={handleApiReady}
          initialData={normalizedInitialScene}
          onChange={(elements, appState, files) => {
            if (readOnly) return
            onSceneChange?.({
              elements: elements.filter((element) => !element.isDeleted),
              appState,
              files,
            })
          }}
          viewModeEnabled={readOnly}
          gridModeEnabled={false}
          theme="light"
        />
      </div>
    </div>
  )
})

export default HandwrittenCanvas