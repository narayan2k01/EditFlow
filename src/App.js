
import React, { useState } from 'react';
//import './App.css';
//import About from './Components/About';
//import Card from './Components/Card';
import Navbar from './Components/Navbar';
import TextForm from './Components/TextForm';
function App() {
  const[mode, setMode] = useState('light');
  const toggleMode = () => {
    if (mode === 'light') {
        setMode('dark');
        document.body.style.backgroundColor = '#042743';
    }
    else {
        setMode('light');
        document.body.style.backgroundColor = 'white';
    }
};

  return (
    <>
      <Navbar title="EditFlow" home="Menu" about="About Us" mode={mode} toggleMode={toggleMode} /> 
<div className="container my-3">
<TextForm heading="Enter Your Text To Analyze Below" mode ={mode}/>
</div>
{/* <About/> */}
    </>
  );
}

export default App;
