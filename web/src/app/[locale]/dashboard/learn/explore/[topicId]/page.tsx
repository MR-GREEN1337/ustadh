"use client";

import React from 'react'
import { useParams } from 'next/navigation'

function page() {
    const topicId = useParams().topicId
  return (
    <div>{topicId}</div>
  )
}

export default page
