import { fromNullable, match } from 'functional-programming-composition'
import type {
  ButtonFxAnnouncements,
  ButtonFxCue,
  ButtonFxIdentityProjection,
} from '../../../../components/bridge/console/buttonFx/buttonFxTypes'
import { selectButtonFxIdentity } from '../../../../entities/bridge/console/buttonFx/buttonFxSelectors'

type AudioContextConstructor = new () => AudioContext
type AudioContextHost = typeof globalThis & {
  readonly AudioContext?: AudioContextConstructor
  readonly webkitAudioContext?: AudioContextConstructor
}

type ContextAcquisition = () => Promise<AudioContext | null>

const INTERACTIVE_SELECTOR = [
  'button:not(:disabled)',
  'input[type="button"]:not(:disabled)',
  'input[type="submit"]:not(:disabled)',
  'input[type="reset"]:not(:disabled)',
  'a[href]',
  '[role="button"]:not([aria-disabled="true"])',
  '[role="menuitem"]:not([aria-disabled="true"])',
  '[role="tab"]:not([aria-disabled="true"])',
  '[role="switch"]:not([aria-disabled="true"])',
].join(',')

const audioHost = globalThis as AudioContextHost
let sharedAudioContext: AudioContext | null = null

const hoverPointerTypes: Readonly<Record<string, true>> = {
  mouse: true,
  pen: true,
}

const closestInteractiveControl = (target: EventTarget | null): Element | null =>
  (target as Element | null)?.closest?.(INTERACTIVE_SELECTOR) ?? null

const structuralControlPath = (root: Document, element: Element): string => {
  const index = Array.from(root.querySelectorAll(INTERACTIVE_SELECTOR)).indexOf(element)
  const pathname = root.defaultView?.location.pathname ?? '/'

  return `${pathname}#control-${index}`
}

const projectControlIdentity = (
  root: Document,
  element: Element
): ButtonFxIdentityProjection => ({
  tag: element.tagName,
  explicitId: element.getAttribute('data-button-fx') ?? element.getAttribute('id'),
  testId: element.getAttribute('data-testid'),
  accessibleName: element.getAttribute('aria-label') ?? element.getAttribute('title'),
  href: element.getAttribute('href'),
  text: element.textContent,
  structuralPath: structuralControlPath(root, element),
})

const identityOfControl =
  (root: Document) =>
  (element: Element | null): string | null =>
    match(
      fromNullable(element),
      (control) => selectButtonFxIdentity(projectControlIdentity(root, control)),
      () => null
    )

const distinctControl = (control: Element | null, related: Element | null) =>
  control === related ? null : control

const hoverCapablePointer = (event: Event): boolean =>
  hoverPointerTypes[(event as PointerEvent).pointerType] ?? false

const hoverControlFrom = (event: Event): Element | null =>
  hoverCapablePointer(event)
    ? distinctControl(
        closestInteractiveControl(event.target),
        closestInteractiveControl((event as PointerEvent).relatedTarget)
      )
    : null

const hoverIdentityFrom =
  (root: Document) =>
  (event: Event): string | null =>
    identityOfControl(root)(hoverControlFrom(event))

const pressIdentityFrom =
  (root: Document) =>
  (event: Event): string | null =>
    identityOfControl(root)(closestInteractiveControl(event.target))

const announceIdentity = (
  announce: (identity: string) => void,
  identity: string | null
): void => match(fromNullable(identity), announce, () => undefined)

const subscribeButtonFx =
  (root: Document) =>
  (announcements: ButtonFxAnnouncements): (() => void) => {
    const onHover = (event: Event) =>
      announceIdentity(announcements.hover, hoverIdentityFrom(root)(event))
    const onPress = (event: Event) =>
      announceIdentity(announcements.press, pressIdentityFrom(root)(event))

    root.addEventListener('pointerover', onHover, { passive: true })
    root.addEventListener('click', onPress, { passive: true })

    return () => {
      root.removeEventListener('pointerover', onHover)
      root.removeEventListener('click', onPress)
    }
  }

export const installButtonFxDelegation = (
  announcements: ButtonFxAnnouncements
): (() => void) | undefined =>
  match(
    fromNullable(globalThis.document),
    (root) => subscribeButtonFx(root)(announcements),
    () => undefined
  )

/** @fp-framework-boundary Web Audio exposes AudioContext only as a constructor. */
const constructAudioContext = (Context: AudioContextConstructor): AudioContext =>
  new Context()

const createAudioContext = (): AudioContext | null => {
  try {
    return match(
      fromNullable(audioHost.AudioContext ?? audioHost.webkitAudioContext),
      constructAudioContext,
      () => null
    )
  } catch {
    return null
  }
}

const acquireAudioContext = (): AudioContext | null => {
  sharedAudioContext = sharedAudioContext ?? createAudioContext()
  return sharedAudioContext
}

const retainRunningContext = (context: AudioContext): AudioContext => context

const runningContexts: Readonly<Record<string, (context: AudioContext) => AudioContext>> =
  {
    running: retainRunningContext,
  }

const runningContextOf = (context: AudioContext): AudioContext | null =>
  match(
    fromNullable(runningContexts[context.state]),
    (retain) => retain(context),
    () => null
  )

const unavailableContext = (): Promise<AudioContext | null> => Promise.resolve(null)

const returnRunningContext = (context: AudioContext): Promise<AudioContext | null> =>
  Promise.resolve(runningContextOf(context))

const resumeSuspendedContext = (context: AudioContext): Promise<AudioContext | null> =>
  Promise.resolve()
    .then(() => context.resume())
    .then(() => runningContextOf(context))
    .catch(() => null)

const resumeContext = (context: AudioContext): Promise<AudioContext | null> => {
  const resumptions: Readonly<
    Record<string, (activeContext: AudioContext) => Promise<AudioContext | null>>
  > = {
    running: returnRunningContext,
    suspended: resumeSuspendedContext,
  }

  return match(
    fromNullable(resumptions[context.state]),
    (resume) => resume(context),
    unavailableContext
  )
}

const acquirePressContext = (): Promise<AudioContext | null> =>
  match(fromNullable(acquireAudioContext()), resumeContext, unavailableContext)

const readHoverContext = (): Promise<AudioContext | null> =>
  match(
    fromNullable(sharedAudioContext),
    (context) => Promise.resolve(runningContextOf(context)),
    unavailableContext
  )

/** Shared browser audio bus after a visitor gesture has unlocked playback. */
export const readArmedAudioContext = readHoverContext

const contextByInteraction = {
  hover: readHoverContext,
  press: acquirePressContext,
} as const satisfies Readonly<Record<ButtonFxCue['interaction'], ContextAcquisition>>

const SILENCE = 0.0001
const ATTACK_SECONDS = 0.008
const MECHANICAL_ATTACK_SECONDS = 0.003
const MECHANICAL_Q = 5.8

/** Web Audio scheduling is the single imperative substrate boundary for button FX. */
const scheduleButtonFxCue = (context: AudioContext, cue: ButtonFxCue): void => {
  const start = context.currentTime
  const stop = start + cue.durationSeconds
  const primary = context.createOscillator()
  const overtone = context.createOscillator()
  const filter = context.createBiquadFilter()
  const envelope = context.createGain()
  const mechanical = context.createOscillator()
  const mechanicalFilter = context.createBiquadFilter()
  const mechanicalEnvelope = context.createGain()
  const mechanicalStop = start + cue.mechanicalTransient.durationSeconds

  primary.type = cue.waveform
  primary.frequency.setValueAtTime(cue.frequency, start)
  primary.frequency.exponentialRampToValueAtTime(cue.destinationFrequency, stop)
  overtone.type = 'sine'
  overtone.frequency.setValueAtTime(cue.overtoneFrequency, start)
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(cue.filterFrequency, start)
  filter.Q.setValueAtTime(4.2, start)
  envelope.gain.setValueAtTime(SILENCE, start)
  envelope.gain.exponentialRampToValueAtTime(cue.gain, start + ATTACK_SECONDS)
  envelope.gain.exponentialRampToValueAtTime(SILENCE, stop)
  mechanical.type = cue.mechanicalTransient.waveform
  mechanical.frequency.setValueAtTime(cue.mechanicalTransient.frequency, start)
  mechanical.frequency.exponentialRampToValueAtTime(
    cue.mechanicalTransient.destinationFrequency,
    mechanicalStop
  )
  mechanicalFilter.type = 'bandpass'
  mechanicalFilter.frequency.setValueAtTime(
    cue.mechanicalTransient.filterFrequency,
    start
  )
  mechanicalFilter.Q.setValueAtTime(MECHANICAL_Q, start)
  mechanicalEnvelope.gain.setValueAtTime(SILENCE, start)
  mechanicalEnvelope.gain.exponentialRampToValueAtTime(
    cue.mechanicalTransient.gain,
    start + MECHANICAL_ATTACK_SECONDS
  )
  mechanicalEnvelope.gain.exponentialRampToValueAtTime(SILENCE, mechanicalStop)

  primary.connect(filter)
  overtone.connect(filter)
  filter.connect(envelope)
  envelope.connect(context.destination)
  mechanical.connect(mechanicalFilter)
  mechanicalFilter.connect(mechanicalEnvelope)
  mechanicalEnvelope.connect(context.destination)
  primary.start(start)
  overtone.start(start)
  mechanical.start(start)
  primary.stop(stop)
  overtone.stop(stop)
  mechanical.stop(mechanicalStop)
}

export const playButtonFxCue = (cue: ButtonFxCue): Promise<void> =>
  contextByInteraction[cue.interaction]()
    .then((context) =>
      match(
        fromNullable(context),
        (runningContext) => scheduleButtonFxCue(runningContext, cue),
        () => undefined
      )
    )
    .catch(() => undefined)
