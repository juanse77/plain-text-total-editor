import { SafeAreaProvider } from 'react-native-safe-area-context';
import FileEditor from './Pages/FileEditor/FileEditor';

export default function App() {
  return (
    <SafeAreaProvider>
      <FileEditor />
    </SafeAreaProvider>
  );
}
