import { createAction } from '@reduxjs/toolkit'
import type { ButtonFxEvent } from '../../../../components/bridge/console/buttonFx/buttonFxTypes'

export const buttonFxHovered = createAction<ButtonFxEvent>('bridge/buttonFxHovered')
export const buttonFxPressed = createAction<ButtonFxEvent>('bridge/buttonFxPressed')
