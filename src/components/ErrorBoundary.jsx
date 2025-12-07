import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white p-8 overflow-auto z-[9999] relative font-mono">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Application Error</h1>
                    <p className="mb-4 text-gray-300">Please screenshot this and send it to your developer:</p>
                    <div className="bg-gray-900 p-4 rounded border border-red-900/50 text-xs whitespace-pre-wrap overflow-x-auto text-red-200">
                        <strong className="text-red-400 block mb-2">{this.state.error && this.state.error.toString()}</strong>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </div>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        className="mt-6 px-6 py-3 bg-red-600 rounded-lg font-bold hover:bg-red-700 transition-colors">
                        Reset App (Clear Cache)
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
