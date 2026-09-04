import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Button } from './button';
import { reportFailure } from './failure';

type ErrorBoundaryState = { failure: Error | null };

/**
 * Catches a render crash and offers a way back instead of a white screen.
 *
 * Worth stating plainly on the screen: the data is on the device and a crash here has
 * not touched it. A user who thinks a bug ate six months of training will delete the
 * app before reporting it.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failure: null };

  static getDerivedStateFromError(failure: Error): ErrorBoundaryState {
    return { failure };
  }

  componentDidCatch(failure: Error, info: ErrorInfo) {
    reportFailure(`Rendering ${info.componentStack?.trim().split('\n')[0] ?? 'a screen'}`, failure);
  }

  render() {
    const { failure } = this.state;
    if (!failure) return this.props.children;

    return (
      <View className="flex-1 items-center justify-center gap-3 bg-surface px-8">
        <Text className="text-center text-lg font-semibold text-content">
          Something went wrong on this screen
        </Text>
        <Text className="text-center text-sm text-content-muted">
          Your logs are stored on this device and are unaffected. {failure.message}
        </Text>
        <View className="mt-2 w-full max-w-xs">
          <Button label="Try again" onPress={() => this.setState({ failure: null })} />
        </View>
      </View>
    );
  }
}
