export default function PageHeader({ title, description }) {
	return (
		<header className="page-header">
			<p className="page-header-kicker">DrugTrack workspace</p>
			<h1 className="page-header-title">{title}</h1>
			{description && <p className="page-header-description">{description}</p>}
		</header>
	)
}
