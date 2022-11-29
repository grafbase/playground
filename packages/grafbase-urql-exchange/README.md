# @grafbase/urql-exchange

URQL-exchange for handling Server Sent Events (SSE)

## Getting Started

Follow these steps in a new or existing React application

1. Install the dependencies

```
npm install urql graphql @grafbase/urql-exchange
```

2. Create URQL client

```ts
// client.ts
import { cacheExchange, createClient, dedupExchange, fetchExchange } from 'urql'

export const client = createClient({
  url: process.env.GRAFBASE_API_URL,
  fetchOptions: {
    headers: { 'x-api-key': process.env.GRAFBASE_API_KEY }
  },
  // Make sure `sseExchange` is put before `fetchExchange`
  exchanges: [dedupExchange, cacheExchange, sseExchange, fetchExchange]
})
```

3. Connect URQL client to React

```ts
// index.ts
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Provider } from 'urql'
import { client } from './client'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider value={client}>
    <App />
  </Provider>
)
```

5. Subscribe to data changes

```tsx
// App.tsx
import { useQuery, gql } from 'urql'

const query = gql`
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
  const [{ data, fetching, error }] = useQuery({ query })

  if (fetching) return <p>Loading...</p>
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