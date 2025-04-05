"use client";

import { useParams } from 'next/navigation';
import React from 'react'

function page() {
    const { subjectId } = useParams<{ subjectId: string }>();
  return (
    <div>{subjectId}</div>
  )
}

export default page
