import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import styles from './HandwrittenCanvas.module.css'

const HandwrittenCanvas = forwardRef(function HandwrittenCanvas(
  { initialScene, onSceneChange, readOnly = false, height = 520, activeTool = 'freedraw' },
  ref
) {
  const excalidrawAPIRef = useRef(null)
  const handleApiReady = useCallback((api) => {
    if (api && excalidrawAPIRef.current !== api) {
      excalidrawAPIRef.current = api
    }
  }, [])

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
  }, [])

  return (
    <div className={`${styles.canvasShell} ${readOnly ? styles.readOnlyShell : ''}`}>
      <div className={styles.canvasViewport} style={{ height: `${height}px` }}>
        <Excalidraw
          excalidrawAPI={handleApiReady}
          initialData={initialScene}
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