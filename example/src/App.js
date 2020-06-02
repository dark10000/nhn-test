import React, { useState, useEffect } from "react";

import UdpPlayer from "nhn-test";

const App = () => {
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    setInterval(() => setCompleted(Math.floor(Math.random() * 100) + 1), 2000);
  }, []);

  return (
    <div className="App">
      <UdpPlayer suuid="demo1" />
    </div>
  );
};

export default App;