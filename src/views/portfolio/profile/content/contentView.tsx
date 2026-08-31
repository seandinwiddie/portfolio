import type React from 'react'
import type { ContentViewProps } from '../../../../features/systems/portfolio/profile/content/contentSelectors'
import ContentSections from '../contentSections/contentSectionsView'

const Content: React.FC<ContentViewProps> = (props) => <ContentSections {...props} />

export default Content
