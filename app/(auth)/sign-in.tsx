import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

const CLERK_ERRORS: Record<string, string> = {
  form_password_incorrect: 'Mật khẩu không đúng.',
  form_identifier_not_found: 'Không tìm thấy tài khoản với email/tên đăng nhập này.',
  form_param_nil: 'Vui lòng điền đầy đủ thông tin.',
  too_many_requests: 'Thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.',
  session_exists: 'Bạn đã đăng nhập rồi.',
  identifier_already_signed_in: 'Tài khoản này đang đăng nhập trên thiết bị khác.',
  network_error: 'Không có kết nối mạng. Vui lòng kiểm tra lại.',
};

function clerkErrorMsg(e: any): string {
  const code = e?.errors?.[0]?.code ?? '';
  const longMsg = e?.errors?.[0]?.longMessage ?? '';
  return CLERK_ERRORS[code] ?? longMsg ?? e?.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) router.replace('/(tabs)/tasks');
  }, [isSignedIn]);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!isLoaded || !identifier.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: identifier.trim(), password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)/tasks');
      }
    } catch (e: any) {
      setError(clerkErrorMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !!identifier.trim() && !!password;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF6EE' }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 52, marginBottom: 12 }}>🏠</Text>
          <Text style={{ fontSize: 30, fontWeight: '800', color: '#2D3A4A' }}>OurHome</Text>
          <Text style={{ fontSize: 14, color: '#8E9BAB', marginTop: 8 }}>Đăng nhập vào gia đình bạn</Text>
        </View>

        <View style={{ gap: 14 }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', marginBottom: 6 }}>EMAIL HOẶC TÊN ĐĂNG NHẬP</Text>
            <TextInput
              value={identifier}
              onChangeText={(t) => { setIdentifier(t); setError(''); }}
              placeholder="you@example.com hoặc username"
              placeholderTextColor="#B0BAC7"
              autoCapitalize="none"
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5,
                borderColor: error ? '#EF4444' : identifier ? '#0EA5E9' : '#EDE8E1',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: '#2D3A4A',
              }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', marginBottom: 6 }}>MẬT KHẨU</Text>
            <TextInput
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              placeholder="••••••••"
              placeholderTextColor="#B0BAC7"
              secureTextEntry
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5,
                borderColor: error ? '#EF4444' : password ? '#0EA5E9' : '#EDE8E1',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: '#2D3A4A',
              }}
            />
          </View>

          {/* Inline error */}
          {!!error && (
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 14 }}>⚠️</Text>
              <Text style={{ fontSize: 13, color: '#DC2626', flex: 1, lineHeight: 18 }}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSignIn}
            disabled={loading || !canSubmit}
            style={{
              backgroundColor: canSubmit ? '#0EA5E9' : '#E0F2FE',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 4,
              shadowColor: '#0EA5E9',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: canSubmit ? 0.3 : 0,
              shadowRadius: 10,
              elevation: canSubmit ? 5 : 0,
            }}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={{ fontSize: 16, fontWeight: '700', color: canSubmit ? '#FFFFFF' : '#93C5FD' }}>Đăng nhập →</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 28, gap: 6 }}>
          <Text style={{ color: '#8E9BAB', fontSize: 14 }}>Chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={{ color: '#0EA5E9', fontSize: 14, fontWeight: '700' }}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
