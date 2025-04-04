"use client";
import React from 'react'
import { useParams } from 'next/navigation';

function page() {
    const { courseId } = useParams();
    //alert(courseId);
  return (
    <div>page</div>
  )
}

export default page
