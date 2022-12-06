import './style.css'

import type { Fetcher } from '@graphiql/toolkit'
import {
  GraphiQL,
  GraphiQLInterface,
  GraphiQLInterfaceProps,
  GraphiQLProvider,
  GraphiQLProviderProps
} from 'graphiql'
import { useCallback } from 'react'
import { GrafbaseLogo } from './components/grafbase-logo'
import { Toolbar } from './components/toolbar'
import { fetcher } from './utils/fetcher'
import { renameTabs } from './utils/rename-tabs'
import { isLiveQuery, SSEProvider, useSSEContext } from './utils/sse'
import { getStorage } from './utils/storage'
import { validateQuery } from './utils/validate-query'

type BaseProps = {
  logo?: React.ReactNode
}

type InterfaceProps = GraphiQLInterfaceProps & BaseProps

const Interface = (props: InterfaceProps) => {
  const { logo, ...rest } = props

  return (
    <GraphiQLInterface {...rest}>
      <GraphiQL.Logo>{logo ?? <GrafbaseLogo />}</GraphiQL.Logo>
      <GraphiQL.Toolbar>
        <Toolbar />
      </GraphiQL.Toolbar>
    </GraphiQLInterface>
  )
}

type ProviderProps = Omit<GraphiQLProviderProps, 'children'> & BaseProps

const Provider = (props: ProviderProps) => {
  const { logo, ...rest } = props
  return (
    <GraphiQLProvider
      {...rest}
      onTabChange={(tabsState) => {
        const tabNames = tabsState.tabs.map((tab) => tab.title)
        setTimeout(() => renameTabs(tabNames), 0)
        props.onTabChange?.(tabsState)
      }}
    >
      <Interface isHeadersEditorEnabled={false} logo={logo} />
    </GraphiQLProvider>
  )
}

type PlaygroundProps = Omit<ProviderProps, 'fetcher' | 'storage'> & {
  endpoint: string
  storageKey?: string
}

const Playground = (props: PlaygroundProps) => {
  const { storageKey = 'grafbase', endpoint, ...rest } = props
  const { sseFetcher } = useSSEContext()

  const headers: Record<string, string> | undefined = props.headers
    ? JSON.parse(props.headers)
    : undefined

  const getFetcher = useCallback<Fetcher>(
    (graphQLParams, fetcherOpts) => {
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
        return sseFetcher({ url: endpoint as string, headers })(
          graphQLParams,
          fetcherOpts
        )
      }
      return fetcher(endpoint as string, { headers })(
        graphQLParams,
        fetcherOpts
      )
    },
    [endpoint, headers, sseFetcher]
  )

  return (
    <Provider {...rest} fetcher={getFetcher} storage={getStorage(storageKey)} />
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
