import type React from 'react'
import type { RecordsViewProps } from '../../../../features/systems/registry/dossier/records/recordsSelectors'
import RecordBanks from '../recordBanks/recordBanksView'

const Records: React.FC<RecordsViewProps> = (props) => <RecordBanks {...props} />

export default Records
