import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// RTK 2 / react-redux 9 form. The previous `TypedUseSelectorHook` annotation is
// the pre-9 pattern and no longer the recommended baseline.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
