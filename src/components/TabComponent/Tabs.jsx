import React, { useState } from "react";

import Checkout from '../../pages/Checkout';
import NFT from '../../pages/NFT';

export default function Tabs() {

    const [activeTab, setActiveTab] = useState("Tokens");

    const handleTab1 = () => {
        // update the state to tab1
        setActiveTab("Tokens");
    };
    const handleTab2 = () => {
        // update the state to tab2
        setActiveTab("NFTs");
    };
    // eslint-disable jsx-a11y/no-noninteractive-element-interactions
    return (
        <div>
            <div className="Tabs">
                {/* Tab nav */}
                <ul className="nav">
                    <li className={activeTab === "Tokens" ? "active" : ""}>
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={handleTab1}
                            onKeyPress={() => { }}>
                            Tokens</div>
                    </li>
                    <li className={activeTab === "NFTs" ? "active" : ""}>
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={handleTab2}
                            onKeyPress={() => { }} >

                            NFT&#39;s</div>
                    </li>
                </ul>
                <div className="outlet">
                    {/* content will be shown here */}
                </div>

            </div>
            {activeTab === "Tokens" ? <Checkout /> : <NFT />}
        </div>

    );
};
