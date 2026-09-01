import type { RegistryRecord } from '../../../../components/substrate/kernel/api/apiTypes'
import type { RuntimeDossierPresentation } from '../../../../components/substrate/kernel/api/presentation/presentationTypes'

export interface RegistryRecordViewModel {
  readonly id: string
  readonly title: string
  readonly description: string
}

export interface RecordBankViewModel {
  readonly id: string
  readonly heading: string
  readonly emptyLabel: string
  readonly items: readonly RegistryRecordViewModel[]
}

export interface RecordsViewProps {
  readonly sections: readonly RecordBankViewModel[]
}

export interface RegistryCapabilitiesViewProps {
  readonly capabilities: readonly RegistryRecordViewModel[]
}

const selectItems = (
  items: readonly RegistryRecord[]
): readonly RegistryRecordViewModel[] =>
  items.map(({ id, title, description }) => ({ id, title, description }))

export const selectRecordsViewModel =
  (
    registryCapabilities: readonly RegistryRecord[],
    operatingProtocols: readonly RegistryRecord[]
  ) =>
  (presentation: RuntimeDossierPresentation | undefined): RecordsViewProps => ({
    sections: [
      {
        id: 'feature',
        heading: presentation?.records.capabilities ?? '',
        emptyLabel: presentation?.records.capabilitiesEmpty ?? '',
        items: selectItems(registryCapabilities),
      },
      {
        id: 'procedure',
        heading: presentation?.records.protocols ?? '',
        emptyLabel: presentation?.records.protocolsEmpty ?? '',
        items: selectItems(operatingProtocols),
      },
    ],
  })
