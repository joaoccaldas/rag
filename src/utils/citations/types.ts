/**
 * Citation Types and Interfaces
 * Supports multiple citation formats for academic and business use
 */

export type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'Harvard' | 'Vancouver'

export type CitationType = 'inline' | 'footnote' | 'endnote' | 'bibliography'

export interface DocumentMetadata {
  id: string
  title: string
  authors?: string[]
  publishDate?: Date | string
  publisher?: string
  url?: string
  doi?: string
  pageNumbers?: string
  accessDate?: Date | string
  type?: 'pdf' | 'book' | 'article' | 'webpage' | 'report' | 'other'
  volume?: string
  issue?: string
  journal?: string
  edition?: string
}

export interface CitationOptions {
  style: CitationStyle
  type?: CitationType
  includeUrl?: boolean
  includeDoi?: boolean
  includeAccessDate?: boolean
  pageNumbers?: string
}

export interface Citation {
  id: string
  text: string
  style: CitationStyle
  type: CitationType
  documentId: string
  metadata: DocumentMetadata
  createdAt: Date
}

export interface CitationFormatResult {
  citation: string
  bibliography?: string
  footnote?: string
  inlineReference?: string
}
