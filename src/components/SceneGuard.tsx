import { Component, type ReactNode } from 'react';

/**
 * Protege la app de fallos de la escena 3D (Spline). Si la escena falla —por ejemplo al
 * cerrarse la sala del Éter cuando la persona sale del nivel 7— se muestra el fondo de
 * respaldo en lugar de dejar toda la pantalla en negro. La interfaz sigue funcionando.
 */
type Props = { fallback: ReactNode; children: ReactNode };
type State = { failed: boolean };

export default class SceneGuard extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(err: unknown) {
    console.warn('[SceneGuard] la escena 3D falló; se usa el fondo de respaldo', err);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
