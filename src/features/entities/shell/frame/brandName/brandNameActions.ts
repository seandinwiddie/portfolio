import { createAction } from '@reduxjs/toolkit'

export const brandNameLoadStarted = createAction('brandName/loadStarted')
export const brandNameReceived = createAction<string>('brandName/received')
export const brandNameLoadFailed = createAction('brandName/loadFailed')
