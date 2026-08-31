import { createAction } from '@reduxjs/toolkit'
import type { SceneWorld } from '../../../../components/shell/frame/ambientScene/ambientSceneTypes'

export const ambientSceneRequestStarted = createAction('ambientScene/requestStarted')
export const ambientSceneReceived = createAction<SceneWorld>('ambientScene/received')
export const ambientSceneRequestFailed = createAction('ambientScene/requestFailed')
