import React, { useState, useRef } from 'react';

export default function TextForm(props) {
  const [text, setText] = useState('');
  const [bionifyResult, setBionifyResult] = useState('');
  const bionicReaderRef = useRef(null);
  const [isBionified, setIsBionified] = useState(false);
  const [bionifyError, setBionifyError] = useState('');

  const handleUpClick = () => {
    const upperCaseText = text.toUpperCase();
    setText(upperCaseText);
    setIsBionified(false);
  };

  const onClickLowercase = () => {
    const lowerCase = text.toLowerCase();
    setText(lowerCase);
    setIsBionified(false);
  };

  const handleOnChange = (event) => {
    console.log("Onchange was clicked");
    setText(event.target.value);
    setIsBionified(false);
  };

  const onClearText = () => {
    console.log("Your Text is clear now");
    setText("");
    setBionifyResult("");
    setIsBionified(false);
  };

  const onClearSpace = () => {
    console.log("Your text white spaces are clear now");
    const cleanedText = text.replace(/\s+/g, ' ');
    setText(cleanedText);
    setIsBionified(false);
  };

  const onCapitized = () => {
    const words = text.split(' ');
    const capitalizedText = words.map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    setText(capitalizedText.join(''));
    setIsBionified(false);
  };

  const onInverse = () => {
    const inverseText = text.split('').map(char => {
      if (char === char.toUpperCase()) {
        return char.toLowerCase();
      } else {
        return char.toUpperCase();
      }
    }).join('');
    setText(inverseText);
    setIsBionified(false);
  };

  const getValues = async () => {
    if (text.trim() === '') {
      setBionifyError('Please enter the text for Bionify');
      return;
    }
    if (isBionified) {
      setBionifyError('The text is already Bionified');
      return;
    }

    setBionifyError('');
    const url = 'https://bionic-reading1.p.rapidapi.com/convert';
    const options = {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-RapidAPI-Key': 'a1ea98382emshc86c3b95ad5d5e6p1fba88jsn1a9d9069255e',
        'X-RapidAPI-Host': 'bionic-reading1.p.rapidapi.com'
      },
      body: new URLSearchParams({
        content: text,
        response_type: 'html',
        request_type: 'html',
        fixation: '1',
        saccade: '10'
      })
    };
    try {
      const response = await fetch(url, options);
      const result = await response.text();
      setBionifyResult(result);
      setIsBionified(true);
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePrint = () => {
    const contentToPrint = bionicReaderRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print</title></head><body>');
    printWindow.document.write(contentToPrint);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className='container' style={{ color: props.mode === 'dark' ? 'white' : '#042743' }}>
      <h1>{props.heading}</h1>
      <div className="mb-3">
        <textarea
          className="form-control"
          value={text}
          style={{ backgroundColor: props.mode === 'dark' ? 'gray' : 'white', color: props.mode === 'dark' ? 'white' : '#042743' }}
          id="myBox"
          rows="5"
          placeholder='Enter your text'
          onChange={handleOnChange}
        ></textarea>
      </div>

      <div>
        <button className="btn btn-outline-primary mx-2" onClick={handleUpClick}>In Uppercase</button>
        <button className="btn btn-outline-primary mx-2" onClick={onClickLowercase}>In Lowercase</button> 
        <button className="btn btn-outline-primary mx-2" onClick={onClearText}>Clear Text</button>
        <button className="btn btn-outline-primary mx-2" onClick={onCapitized}>In Capitalized Case</button>
        <button className="btn btn-outline-primary mx-2" onClick={onInverse}>Inverse Case</button>
        <button className="btn btn-outline-primary mx-2" onClick={onClearSpace}>Clear Extra Space</button>
        <button className="btn btn-outline-secondary mx-2" onClick={() => getValues()}>Bionify</button>
        {isBionified && (
          <button className="btn btn-outline-success mx-2" onClick={handlePrint}>Download Bionic Text </button>
        )}
        {bionifyError && <div style={{ color: 'red' }}>{bionifyError}</div>}
      </div>

      <div className='container my-3' style={{ color: props.mode === 'dark' ? 'white' :'#042743' }}>
        <h2>Your Text summary</h2>
        <p>{text.split(" ").length} words and {text.length} characters</p>
        <p>Need {0.008 * text.split(" ").length} Minutes to read this Text</p>
      </div>

      {bionifyResult && (
        <div ref={bionicReaderRef} className="bionic-reader" style={{ border: '1px solid black', borderRadius: '15px', width: 'fit-content', marginLeft: '4px', padding: '15px' }} dangerouslySetInnerHTML={{ __html: bionifyResult }}></div>
      )}
    </div>
  );
}