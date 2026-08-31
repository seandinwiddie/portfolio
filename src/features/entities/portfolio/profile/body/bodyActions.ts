import { createAction } from '@reduxjs/toolkit'
import type { AppData } from '../../../../components/platform/foundation/api/apiTypes'

export const bodyDataReceived = createAction<AppData>('body/dataReceived')
export const bodyDataRequestStarted = createAction('body/dataRequestStarted')
export const bodyDataRequestFailed = createAction('body/dataRequestFailed')
