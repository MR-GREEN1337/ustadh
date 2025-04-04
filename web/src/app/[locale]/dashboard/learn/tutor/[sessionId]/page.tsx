import React from 'react'

async function page({ params }: { params: { sessionId: string } }) {
    const { sessionId } = await params;
  return (
    <div>{sessionId}</div>
  )
}

export default page
