import { render } from 'preact';

import { Dashboard } from './pages/Dashboard/index.jsx';
import './style.css';

export function App() {
	return <Dashboard />;
}

render(<App />, document.getElementById('app'));
