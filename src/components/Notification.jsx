export default function Notification({ notification, onClose }) {
    if (!notification) return null;

    const styles = {
        success: 'border-l-4 border-green-500',
        error: 'border-l-4 border-red-500',
        warning: 'border-l-4 border-yellow-500',
        info: 'border-l-4 border-blue-500',
    };

    const icon = {
        success: '✓',
        error: '!',
        warning: '⚠',
        info: 'i',
    };

    const iconColors = {
        success: 'text-green-500 bg-green-100',
        error: 'text-red-500 bg-red-100',
        warning: 'text-yellow-600 bg-yellow-100',
        info: 'text-blue-500 bg-blue-100',
    };

    return (
        <div className={`fixed top-24 right-4 z-50 animate-slide-in max-w-sm w-full bg-white shadow-2xl rounded-lg overflow-hidden ${styles[notification.type] || styles.info}`}>
            <div className="p-4 flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${iconColors[notification.type] || iconColors.info}`}>
                    {icon[notification.type] || icon.info}
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900 mb-1">{notification.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{notification.message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
