# @grafbase/apollo-link

Apollo-link for handling Server Sent Events (SSE)

## Getting Started

Follow these steps in a new or existing React application

1. Install the dependencies

```
npm install @apollo/client graphql @grafbase/apollo-link
```

2. Initialize ApolloClient

```ts
// client.ts
import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client'

const initializeApolloClient = (link: ApolloLink) => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: link
  })
}
```

3. Create ApolloLink

```ts
// client.ts
import { HttpLink, split } from '@apollo/client'
import { getOperationAST } from 'graphql'
import { isLiveQuery, SSELink } from '@grafbase/apollo-link'

export const createApolloLink = () => {
  const sseLink = new SSELink({
    uri: process.env.GRAFBASE_API_URL,
    headers: {
      'x-api-key': process.env.GRAFBASE_API_KEY
    }
  })

  const httpLink = new HttpLink({
    uri: process.env.GRAFBASE_API_URL,
    headers: {
      'x-api-key': process.env.GRAFBASE_API_KEY
    }
  })

  return split(
    ({ query, operationName, variables }) =>
      isLiveQuery(getOperationAST(query, operationName), variables),
    sseLink,
    httpLink
  )
}
```

4. Connect ApolloClient to React

```ts
// index.ts
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ApolloProvider } from '@apollo/client'
import { initializeApolloClient } from './client'

const client = initializeApolloClient(createApolloLink())

ReactDOM.createRoot(document.getElementById('root')).render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
)
```

5. Subscribe to data changes

```tsx
// App.tsx
import { gql, useQuery } from '@apollo/client'

const QUERY = gql`
  query @live {
    todoListCollection(first: 5) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
`

function App() {
  const { loading, error, data } = useQuery(QUERY)

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error : {error.message}</p>

  return (
    <>
      {data?.todoListCollection?.edges?.map(
        ({ node: { id, title } }: { node: { id: string; title: string } }) => (
          <div key={id}>
            <div>{title}</div>
          </div>
        )
      )}
    </>
  )
}

export default App
```