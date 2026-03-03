export default function Spotlight({ position }) {
    if (!position) return null;

    return (
        <div
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: position.width,
                height: position.height,
                borderRadius: '8px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                pointerEvents: 'none',
                transition: 'all 150ms ease-out', // a changer pour la vitesse
                zIndex: 1
            }}
        />
    );
}