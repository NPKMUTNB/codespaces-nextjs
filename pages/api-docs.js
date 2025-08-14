import dynamic from 'next/dynamic'
import Head from 'next/head'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocs() {
  return (
    <>
      <Head>
        <title>API Docs | World News Proxy</title>
      </Head>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 60px' }}>
        <SwaggerUI url="/api/openapi" docExpansion="list" defaultModelsExpandDepth={1} />
      </div>
    </>
  )
}
