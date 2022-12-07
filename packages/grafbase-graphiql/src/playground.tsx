import './style.css'

import type { Fetcher } from '@graphiql/toolkit'
import {
  GraphiQL,
  GraphiQLInterface,
  GraphiQLInterfaceProps,
  GraphiQLProvider,
  GraphiQLProviderProps
} from 'graphiql'
import { ReactNode, useCallback } from 'react'
import { GrafbaseLogo } from './components/grafbase-logo'
import { Toolbar } from './components/toolbar'
import { fetcher } from './utils/fetcher'
import { renameTabs } from './utils/rename-tabs'
import { isLiveQuery, SSEProvider, useSSEContext } from './utils/sse'
import { getStorage } from './utils/storage'
import { validateQuery } from './utils/validate-query'

type PlaygroundProps = Omit<
  GraphiQLProviderProps,
  'children' | 'fetcher' | 'storage'
> &
  GraphiQLInterfaceProps & {
    endpoint: string
    storageKey?: string
    logo?: ReactNode
  }

const Playground = ({
  storageKey = 'grafbase',
  endpoint,
  logo,
  dangerouslyAssumeSchemaIsValid,
  defaultQuery,
  defaultTabs,
  externalFragments,
  getDefaultFieldNames,
  headers,
  initialTabs,
  inputValueDeprecation,
  introspectionQueryName,
  maxHistoryLength,
  onEditOperationName,
  onSchemaChange,
  onTabChange,
  onTogglePluginVisibility,
  operationName,
  plugins,
  query,
  response,
  schema,
  schemaDescription,
  shouldPersistHeaders,
  validationRules,
  variables,
  visiblePlugin,
  defaultHeaders,
  ...props
}: PlaygroundProps) => {
  const { sseFetcher } = useSSEContext()

  const getFetcher = useCallback<Fetcher>(
    (graphQLParams, fetcherOpts) => {
      const _headers: Record<string, string> | undefined = headers
        ? JSON.parse(headers)
        : undefined
      const isExecutable = validateQuery(graphQLParams.query)
      if (!isExecutable) {
        return Promise.reject('Query is not executable')
      }
      const isLive = fetcherOpts?.documentAST
        ? isLiveQuery(
            fetcherOpts.documentAST,
            graphQLParams.operationName || undefined
          )
        : false
      if (isLive) {
        return sseFetcher({ url: endpoint as string, headers: _headers })(
          graphQLParams,
          fetcherOpts
        )
      }
      return fetcher(endpoint as string, { headers: _headers })(
        graphQLParams,
        fetcherOpts
      )
    },
    [endpoint, headers, sseFetcher]
  )

  return (
    <GraphiQLProvider
      fetcher={getFetcher}
      storage={getStorage(storageKey)}
      onTabChange={(tabsState) => {
        const tabNames = tabsState.tabs.map((tab) => tab.title)
        setTimeout(() => renameTabs(tabNames), 0)
        onTabChange?.(tabsState)
      }}
      getDefaultFieldNames={getDefaultFieldNames}
      dangerouslyAssumeSchemaIsValid={dangerouslyAssumeSchemaIsValid}
      defaultQuery={defaultQuery}
      defaultHeaders={defaultHeaders}
      defaultTabs={defaultTabs}
      externalFragments={externalFragments}
      headers={headers}
      initialTabs={initialTabs}
      inputValueDeprecation={inputValueDeprecation}
      introspectionQueryName={introspectionQueryName}
      maxHistoryLength={maxHistoryLength}
      onEditOperationName={onEditOperationName}
      onSchemaChange={onSchemaChange}
      onTogglePluginVisibility={onTogglePluginVisibility}
      plugins={plugins}
      visiblePlugin={visiblePlugin}
      operationName={operationName}
      query={query}
      response={response}
      schema={schema}
      schemaDescription={schemaDescription}
      shouldPersistHeaders={shouldPersistHeaders}
      validationRules={validationRules}
      variables={variables}
    >
      <GraphiQLInterface
        isHeadersEditorEnabled={false}
        defaultEditorToolsVisibility={false}
        {...props}
      >
        <GraphiQL.Logo>{logo ?? <GrafbaseLogo />}</GraphiQL.Logo>
        <GraphiQL.Toolbar>
          <Toolbar />
        </GraphiQL.Toolbar>
      </GraphiQLInterface>
    </GraphiQLProvider>
  )
}

const PlaygroundWithProviders = (props: PlaygroundProps) => {
  return (
    <SSEProvider>
      <Playground {...props} />
    </SSEProvider>
  )
}

export default PlaygroundWithProviders
