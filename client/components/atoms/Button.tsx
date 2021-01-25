import React from 'react'
import '../../styles/globals.css'

export default ({ style, children }) => (
  <button
    className={`${style} border border-indigo-500 bg-indigo-500 text-white rounded-md px-4 py-2 m-2 transition duration-500 ease select-none hover:bg-indigo-600 focus:outline-none focus:shadow-outline`}
  >
    {children}
  </button>
)
