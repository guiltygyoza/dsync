import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";

interface ConnectWalletProps {
	theme: "light" | "dark";
}

export function ConnectWallet({ theme }: ConnectWalletProps) {
	const { address, connector, isConnected } = useAccount();
	const { data: ensName } = useEnsName({ address });
	const { connect, connectors, error, isPending } = useConnect();
	const { disconnect } = useDisconnect();

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const formattedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

	useEffect(() => {
		if (isModalOpen || isConnected) {
			setIsDropdownOpen(false);
		}
	}, [isModalOpen, isConnected]);

	useEffect(() => {
		if (isConnected) {
			setIsModalOpen(false);
		}
	}, [isConnected]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		}

		if (isDropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isDropdownOpen]);

	// Define themed styles
	const themedStyles = {
		buttonPrimaryBg: theme === "dark" ? "#4A5568" : "#E2E8F0",
		buttonPrimaryText: theme === "dark" ? "#E2E8F0" : "#2D3748",
		buttonPrimaryBorder: theme === "dark" ? "#718096" : "#CBD5E0",
		buttonSecondaryBg: theme === "dark" ? "#2D3748" : "#F7FAFC",
		buttonSecondaryText: theme === "dark" ? "#CBD5E0" : "#4A5568",
		buttonSecondaryBorder: theme === "dark" ? "#4A5568" : "#E2E8F0",
		modalBg: theme === "dark" ? "#2D3748" : "#FFFFFF",
		modalText: theme === "dark" ? "#E2E8F0" : "#1A202C",
		modalInputBorder: theme === "dark" ? "#4A5568" : "#CBD5E0",
		disconnectButtonBg: theme === "dark" ? "#C53030" : "#FEB2B2",
		disconnectButtonText: theme === "dark" ? "#FED7D7" : "#742A2A",
		disconnectButtonBorder: theme === "dark" ? "#E53E3E" : "#F56565",
	};

	if (isConnected) {
		return (
			<div style={{ position: "relative", display: "inline-block" }} ref={dropdownRef}>
				<button
					onClick={() => setIsDropdownOpen(!isDropdownOpen)}
					style={{
						background: themedStyles.buttonPrimaryBg,
						color: themedStyles.buttonPrimaryText,
						border: `1px solid ${themedStyles.buttonPrimaryBorder}`,
						padding: "8px 12px",
						borderRadius: "6px",
						cursor: "pointer",
						minWidth: "150px",
						textAlign: "center",
					}}
				>
					{ensName ? `${ensName} (${formattedAddress})` : formattedAddress}
				</button>
				{isDropdownOpen && (
					<div
						style={{
							position: "absolute",
							top: "100%",
							right: 0,
							background: themedStyles.modalBg,
							color: themedStyles.modalText,
							border: `1px solid ${themedStyles.buttonPrimaryBorder}`,
							borderRadius: "6px",
							marginTop: "4px",
							padding: "8px",
							boxShadow: theme === "dark" ? "0 2px 10px rgba(0,0,0,0.5)" : "0 2px 10px rgba(0,0,0,0.1)",
							zIndex: 10,
						}}
					>
						{connector && (
							<div
								style={{
									marginBottom: "8px",
									fontSize: "0.9em",
									color: theme === "dark" ? "#A0AEC0" : "#718096",
								}}
							>
								Connected to {connector.name}
							</div>
						)}
						<button
							onClick={() => {
								disconnect();
							}}
							style={{
								background: themedStyles.disconnectButtonBg,
								color: themedStyles.disconnectButtonText,
								border: `1px solid ${themedStyles.disconnectButtonBorder}`,
								padding: "8px 12px",
								borderRadius: "6px",
								cursor: "pointer",
								width: "100%",
								textAlign: "left",
							}}
						>
							Disconnect
						</button>
					</div>
				)}
			</div>
		);
	}

	return (
		<>
			<button
				onClick={() => setIsModalOpen(true)}
				style={{
					background: themedStyles.buttonPrimaryBg,
					color: themedStyles.buttonPrimaryText,
					border: `1px solid ${themedStyles.buttonPrimaryBorder}`,
					padding: "10px 15px",
					borderRadius: "6px",
					cursor: "pointer",
					minWidth: "150px",
					textAlign: "center",
				}}
			>
				Connect Wallet
			</button>

			{isModalOpen && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: theme === "dark" ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1000,
					}}
					onClick={() => setIsModalOpen(false)}
				>
					<div
						style={{
							background: themedStyles.modalBg,
							color: themedStyles.modalText,
							padding: "20px",
							borderRadius: "8px",
							boxShadow: theme === "dark" ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.2)",
							minWidth: "300px",
							maxWidth: "90%",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<h3 style={{ marginTop: 0, marginBottom: "15px", textAlign: "center" }}>Choose Wallet</h3>
						<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
							{connectors.map((c) => (
								<button
									key={c.id}
									onClick={() => {
										connect({ connector: c });
									}}
									disabled={isPending}
									style={{
										background: themedStyles.buttonSecondaryBg,
										color: themedStyles.buttonSecondaryText,
										border: `1px solid ${isPending ? themedStyles.modalInputBorder : themedStyles.buttonSecondaryBorder}`,
										padding: "12px 18px",
										borderRadius: "6px",
										cursor: "pointer",
										fontSize: "16px",
										textAlign: "left",
										display: "flex",
										alignItems: "center",
										gap: "10px",
									}}
								>
									{isPending ? "Connecting..." : c.name}
								</button>
							))}
						</div>
						{connectors.length === 0 && (
							<p style={{ textAlign: "center", color: theme === "dark" ? "#A0AEC0" : "#718096" }}>
								No wallet connectors found. Please install a wallet like MetaMask.
							</p>
						)}
						{error && (
							<div
								style={{
									color: theme === "dark" ? "#FC8181" : "#E53E3E",
									marginTop: "15px",
									textAlign: "center",
								}}
							>
								{error.message}
							</div>
						)}
						<button
							onClick={() => setIsModalOpen(false)}
							style={{
								marginTop: "20px",
								background: themedStyles.buttonPrimaryBg,
								color: themedStyles.buttonPrimaryText,
								border: `1px solid ${themedStyles.buttonPrimaryBorder}`,
								padding: "8px 15px",
								borderRadius: "6px",
								cursor: "pointer",
								display: "block",
								marginLeft: "auto",
								marginRight: "auto",
							}}
						>
							Close
						</button>
					</div>
				</div>
			)}
		</>
	);
}

export default ConnectWallet;
