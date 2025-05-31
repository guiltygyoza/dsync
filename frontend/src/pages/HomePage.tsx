import React from "react";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
	return (
		<div>
			<Link to="/eips" style={{ textDecoration: "none", color: "inherit" }}>
				<h1>Ethereum Improvement Proposals</h1>
			</Link>
		</div>
	);
};

export default HomePage;
