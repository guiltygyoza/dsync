import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css";

// Mock data for AllCoreDev calls
const upcomingCalls = [
	{
		id: 1,
		date: "June 15, 2025",
		time: "14:00 UTC",
		meetingLink: "/",
		agendaLink: "/",
		mainTopics: ["EIP-4844 Updates", "Shanghai Upgrade", "Beacon Chain"],
	},
	{
		id: 2,
		date: "June 29, 2025",
		time: "14:00 UTC",
		meetingLink: "/",
		agendaLink: "/",
		mainTopics: ["EIP-1559 Follow-up", "Client Diversity", "MEV Discussion"],
	},
	{
		id: 3,
		date: "July 13, 2025",
		time: "14:00 UTC",
		meetingLink: "/",
		agendaLink: "/",
		mainTopics: ["Verkle Trees", "EIP-6780", "Network Security"],
	},
];

const pastCalls = [
	{
		id: 101,
		date: "May 18, 2025",
		recordingLink: "/",
		notesLink: "/",
		eipsDiscussed: ["EIP-4844", "EIP-1559", "EIP-3675"],
	},
	{
		id: 100,
		date: "May 4, 2025",
		recordingLink: "/",
		notesLink: "/",
		eipsDiscussed: ["EIP-6780", "EIP-4895"],
	},
	{
		id: 99,
		date: "April 20, 2025",
		recordingLink: "/",
		notesLink: "/",
		eipsDiscussed: ["EIP-4844", "EIP-6110"],
	},
	{
		id: 98,
		date: "April 6, 2025",
		recordingLink: "/",
		notesLink: "/",
		eipsDiscussed: ["EIP-4844", "EIP-4788"],
	},
];

// Featured EIPs - focusing on non-final and recent ones that need active discussions
const featuredEips = [
	{ number: "7212", title: "Precompiled for secp256r1 Curve Support", status: "Review" },
	{ number: "7002", title: "Execution Layer Triggerable Exits", status: "Draft" },
	{ number: "6780", title: "SELFDESTRUCT only in same transaction", status: "Review" },
	{ number: "7045", title: "Increase the gas cost of SSTORE", status: "Draft" },
	// { number: "6913", title: "Add SETCODE instruction", status: "Stagnant" }
];

// Stats
const stats = {
	totalEips: 7219,
	activeDiscussions: 42,
	finalEips: 89,
	lastUpdated: "June 8, 2025",
};

const HomePage: React.FC = () => {
	const calculateTimeLeft = () => {
		const nextCallDate = new Date(`${upcomingCalls[0].date} ${upcomingCalls[0].time}`);
		const difference = nextCallDate.getTime() - new Date().getTime();

		if (difference > 0) {
			return {
				days: Math.floor(difference / (1000 * 60 * 60 * 24)),
				hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
				minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
				seconds: Math.floor((difference % (1000 * 60)) / 1000),
			};
		}
		return null;
	};

	const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft(calculateTimeLeft());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	return (
		<div className="home-container">
			{/* Hero Section */}
			<section className="hero-section">
				<div className="hero-content">
					<img
						src="/assets/generated-eth-congress-logo.png"
						alt="Ethereum Congress Logo"
						className="congress-logo"
					/>
					<h1>Ethereum Congress</h1>
					<h2>Ethereum Protocol Legislation</h2>
					<p>
						Welcome to the Ethereum Congress, where protocol governance happens through Ethereum Improvement
						Proposals process.
					</p>
				</div>
			</section>

			{/* AllCoreDev Calls Section */}
			<section className="calls-section">
				<h2>Plenary Meetings</h2>

				{/* Upcoming Calls */}
				<div className="upcoming-calls">
					{/* <h3>Upcoming Meetings</h3> */}
					<div className="countdown-floor-container">
						<div className="next-call-countdown">
							{timeLeft ? (
								<>
									<div className="countdown-boxes-container">
										<div className="countdown-box">
											<span className="countdown-number">{timeLeft.days}</span>
											<span className="countdown-label">days</span>
										</div>
										<div className="countdown-box">
											<span className="countdown-number">{timeLeft.hours}</span>
											<span className="countdown-label">hours</span>
										</div>
										<div className="countdown-box">
											<span className="countdown-number">{timeLeft.minutes}</span>
											<span className="countdown-label">minutes</span>
										</div>
										<div className="countdown-box">
											<span className="countdown-number">{timeLeft.seconds}</span>
											<span className="countdown-label">seconds</span>
										</div>
									</div>
									<span className="countdown-text">until next meeting</span>
								</>
							) : (
								<span className="countdown-text">Meeting is live!</span>
							)}
						</div>

						<div className="vertical-separator"></div>

						<div className="enter-floor-container">
							<Link to="/floor" className="enter-floor-button">
								Enter the Floor
							</Link>
						</div>
					</div>

					<div className="call-cards">
						{upcomingCalls.map((call) => (
							<div key={call.id} className="call-card">
								<div className="call-header">
									<h4>{call.date}</h4>
									<span className="call-time">{call.time}</span>
								</div>
								<div className="call-links">
									<a href={call.agendaLink} target="_blank" rel="noopener noreferrer">
										View Agenda
									</a>
								</div>
								<div className="call-topics">
									<h5>Main Topics:</h5>
									<ul>
										{call.mainTopics.map((topic, index) => (
											<li key={index}>{topic}</li>
										))}
									</ul>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Past Calls */}
				<div className="past-calls">
					<h3>Past Meetings</h3>
					<table className="past-calls-table">
						<thead>
							<tr>
								<th>Meeting #</th>
								<th>Date</th>
								<th>Recording</th>
								<th>Notes</th>
								<th>EIPs Discussed</th>
							</tr>
						</thead>
						<tbody>
							{pastCalls.map((call) => (
								<tr key={call.id}>
									<td data-label="Meeting #">#{call.id}</td>
									<td data-label="Date">{call.date}</td>
									<td data-label="Recording">
										<a href={call.recordingLink} target="_blank" rel="noopener noreferrer">
											Watch
										</a>
									</td>
									<td data-label="Notes">
										<a href={call.notesLink} target="_blank" rel="noopener noreferrer">
											Notes
										</a>
									</td>
									<td data-label="EIPs Discussed">
										{call.eipsDiscussed.map((eip, index) => (
											<Link
												key={index}
												to={`/eips/${eip.replace("EIP-", "")}`}
												className="eip-link"
											>
												{eip}
												{index < call.eipsDiscussed.length - 1 ? ", " : ""}
											</Link>
										))}
									</td>
								</tr>
							))}
						</tbody>
					</table>
					<div className="view-all-link" style={{ textAlign: "center" }}>
						<Link to="/">View All Past Meetings →</Link>
					</div>
				</div>
			</section>

			{/* Quick Navigation */}
			<section className="quick-nav-section">
				<div className="section-header">
					<h2>Hearing Rooms</h2>
					<div>
						<Link to="/eips" className="view-all">
							View All EIPs →
						</Link>
					</div>
				</div>

				<div className="featured-eips">
					{/* <h3>Featured EIPs</h3> */}
					<div className="eip-cards">
						{featuredEips.map((eip) => (
							<Link to={`/eips/${eip.number}`} key={eip.number} className="eip-card">
								<div className={`status-indicator ${eip.status.toLowerCase()}`}></div>
								<h4>EIP-{eip.number}</h4>
								<p>{eip.title}</p>
								<span className={`eip-status status-${eip.status.toLowerCase()}`}>{eip.status}</span>
							</Link>
						))}
					</div>
				</div>

				<div className="stats-container">
					<div className="stat-box">
						<span className="stat-number">{stats.totalEips}</span>
						<span className="stat-label">Total EIPs</span>
					</div>
					<div className="stat-box">
						<span className="stat-number">{stats.activeDiscussions}</span>
						<span className="stat-label">Active Discussions</span>
					</div>
					<div className="stat-box">
						<span className="stat-number">{stats.finalEips}</span>
						<span className="stat-label">Final EIPs</span>
					</div>
					<div className="stats-updated">Last updated: {stats.lastUpdated}</div>
				</div>
			</section>

			{/* Community Section */}
			<section className="community-section">
				<h2>Join the Community</h2>
				<div className="community-links">
					<a
						href="https://discord.gg/ethereum"
						target="_blank"
						rel="noopener noreferrer"
						className="community-link"
					>
						<div className="community-icon discord"></div>
						<span>Discord</span>
					</a>
					<a
						href="https://twitter.com/ethereum"
						target="_blank"
						rel="noopener noreferrer"
						className="community-link"
					>
						<div className="community-icon twitter"></div>
						<span>Twitter</span>
					</a>
					<a
						href="https://github.com/ethereum"
						target="_blank"
						rel="noopener noreferrer"
						className="community-link"
					>
						<div className="community-icon github"></div>
						<span>GitHub</span>
					</a>
					<a
						href="https://ethereum.org/en/community/"
						target="_blank"
						rel="noopener noreferrer"
						className="community-link"
					>
						<div className="community-icon ethereum"></div>
						<span>Ethereum.org</span>
					</a>
				</div>
				{/* <div className="participation-info">
          <h3>How to Participate</h3>
          <p>
            Anyone can participate in Ethereum governance by discussing EIPs, 
            joining AllCoreDev calls, or submitting new proposals. 
            Learn more about the <a href="https://eips.ethereum.org/EIPS/eip-1" target="_blank" rel="noopener noreferrer">EIP process</a>.
          </p>
        </div> */}
			</section>
		</div>
	);
};

export default HomePage;
