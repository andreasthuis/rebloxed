//import { useState } from "react";

interface GameDetailsProps {
  group: any;
}

const GameDetails = ({ group }: GameDetailsProps) => {
  //const [activeTab, setActiveTab] = useState<"about" | "servers">("about");
  
  return (
    <div className="group-details">
        <h2>{group}</h2>
    </div>
  );
};

export default GameDetails;
