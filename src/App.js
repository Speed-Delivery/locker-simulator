import React from "react";
import Locker from "./lockers/Locker";

const App = () => {
  return (
    <div>
      <h1 className="text-center text-4xl font-bold m-8">
        Touch Screen Simulator
      </h1>
      <Locker />
    </div>
  );
};

export default App;
