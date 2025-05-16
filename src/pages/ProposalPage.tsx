import ChamberDetail from "../components/ChamberDetail";
import CommentList from "../components/CommentList";
import CreateCommentForm from "../components/CreateCommentForm";

function ChamberPage() {
	return (
		<div>
			<ChamberDetail />
			<hr />
			<h3>Discussion Forum</h3>
			<CreateCommentForm />
			<CommentList />
		</div>
	);
}

export default ChamberPage;
