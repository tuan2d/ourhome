import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

const CLERK_ERRORS: Record<string, string> = {
  form_identifier_exists: 'Email hoặc tên đăng nhập này đã được dùng.',
  form_username_invalid_character: 'Tên đăng nhập chỉ được dùng chữ cái, số và dấu gạch dưới.',
  form_username_too_short: 'Tên đăng nhập phải có ít nhất 3 ký tự.',
  form_password_pwned: 'Mật khẩu này quá phổ biến. Vui lòng chọn mật khẩu khác.',
  form_password_length_too_short: 'Mật khẩu phải có ít nhất 8 ký tự.',
  form_password_no_uppercase: 'Mật khẩu cần ít nhất 1 chữ in hoa.',
  form_password_no_digit: 'Mật khẩu cần ít nhất 1 chữ số.',
  form_param_nil: 'Vui lòng điền đầy đủ thông tin.',
  too_many_requests: 'Thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.',
  network_error: 'Không có kết nối mạng. Vui lòng kiểm tra lại.',
};

function clerkErrorMsg(e: any): string {
  const code = e?.errors?.[0]?.code ?? '';
  const longMsg = e?.errors?.[0]?.longMessage ?? '';
  return CLERK_ERRORS[code] ?? longMsg ?? e?.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

function useClerkCaptchaWeb() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (document.getElementById('clerk-captcha')) return;
    const el = document.createElement('div');
    el.id = 'clerk-captcha';
    document.body.appendChild(el);
    return () => { el.remove(); };
  }, []);
}

type Mode = 'email' | 'username';

export default function SignUp() {
  useClerkCaptchaWeb();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) router.replace('/(tabs)/tasks');
  }, [isSignedIn]);

  const [mode, setMode] = useState<Mode>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const handleSignUp = async () => {
    if (!isLoaded || !name.trim() || !password) return;
    if (mode === 'email' && !email.trim()) return;
    if (mode === 'username' && !username.trim()) return;
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'username') {
        result = await signUp.create({
          firstName: name.trim(),
          username: username.trim().toLowerCase(),
          password,
        });
      } else {
        result = await signUp.create({
          firstName: name.trim(),
          emailAddress: email.trim(),
          password,
        });
      }

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(onboarding)/family-setup');
      } else if (result.unverifiedFields?.includes('email_address')) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_link', redirectUrl: 'ourhome://verified' });
        setPendingEmail(email.trim());
      }
    } catch (e: any) {
      setError(clerkErrorMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = name.trim() && password &&
    (mode === 'email' ? !!email.trim() : !!username.trim());

  if (pendingEmail) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF6EE' }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28, alignItems: 'center' }}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>📧</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#2D3A4A', marginBottom: 12 }}>Kiểm tra email</Text>
          <Text style={{ fontSize: 14, color: '#8E9BAB', textAlign: 'center', lineHeight: 22 }}>
            Đã gửi link xác thực tới{'\n'}
            <Text style={{ fontWeight: '700', color: '#2D3A4A' }}>{pendingEmail}</Text>
          </Text>
          <Text style={{ fontSize: 13, color: '#8E9BAB', textAlign: 'center', marginTop: 12 }}>
            Mở email và click link để hoàn tất đăng ký.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/sign-in')}
            style={{ marginTop: 32, backgroundColor: '#EDE8E1', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#8E9BAB' }}>Về trang đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF6EE' }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Text style={{ fontSize: 52, marginBottom: 12 }}>🏠</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#2D3A4A' }}>Tạo tài khoản</Text>
            <Text style={{ fontSize: 14, color: '#8E9BAB', marginTop: 8 }}>Bắt đầu hành trình của gia đình</Text>
          </View>

          {/* Mode toggle */}
          <View style={{ flexDirection: 'row', backgroundColor: '#EDE8E1', borderRadius: 14, padding: 3, marginBottom: 20 }}>
            {(['email', 'username'] as Mode[]).map((m) => (
              <TouchableOpacity key={m} onPress={() => setMode(m)}
                style={{ flex: 1, paddingVertical: 9, borderRadius: 11, backgroundColor: mode === m ? '#FFFFFF' : 'transparent', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: mode === m ? '#0EA5E9' : '#8E9BAB' }}>
                  {m === 'email' ? '📧 Dùng email' : '👤 Tên đăng nhập'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'username' && (
            <View style={{ backgroundColor: '#FFF7ED', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>💡</Text>
              <Text style={{ fontSize: 12, color: '#92400E', flex: 1, lineHeight: 18 }}>
                Dành cho các bạn nhỏ không có email. Đăng nhập bằng tên đăng nhập + mật khẩu.
              </Text>
            </View>
          )}

          <View style={{ gap: 14 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', marginBottom: 6 }}>TÊN HIỂN THỊ</Text>
              <TextInput value={name} onChangeText={(t) => { setName(t); setError(''); }} placeholder="Ví dụ: Bố Minh, Bé Na..." placeholderTextColor="#B0BAC7"
                style={{ backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: name ? '#0EA5E9' : '#EDE8E1', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#2D3A4A' }} />
            </View>

            {mode === 'email' ? (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', marginBottom: 6 }}>EMAIL</Text>
                <TextInput value={email} onChangeText={(t) => { setEmail(t); setError(''); }} placeholder="you@example.com" placeholderTextColor="#B0BAC7"
                  autoCapitalize="none" keyboardType="email-address"
                  style={{ backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: error ? '#EF4444' : email ? '#0EA5E9' : '#EDE8E1', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#2D3A4A' }} />
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', marginBottom: 6 }}>TÊN ĐĂNG NHẬP</Text>
                <TextInput value={username} onChangeText={(t) => { setUsername(t.toLowerCase().replace(/\s/g, '')); setError(''); }}
                  placeholder="vidu: bena123" placeholderTextColor="#B0BAC7" autoCapitalize="none"
                  style={{ backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: username ? '#0EA5E9' : '#EDE8E1', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#2D3A4A' }} />
              </View>
            )}

            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', marginBottom: 6 }}>MẬT KHẨU</Text>
              <TextInput value={password} onChangeText={(t) => { setPassword(t); setError(''); }} placeholder="Tối thiểu 8 ký tự" placeholderTextColor="#B0BAC7"
                secureTextEntry
                style={{ backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: error ? '#EF4444' : password ? '#0EA5E9' : '#EDE8E1', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#2D3A4A' }} />
            </View>

            {!!error && (
              <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 14 }}>⚠️</Text>
                <Text style={{ fontSize: 13, color: '#DC2626', flex: 1, lineHeight: 18 }}>{error}</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleSignUp} disabled={loading || !canSubmit}
              style={{ backgroundColor: canSubmit ? '#0EA5E9' : '#E0F2FE', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8,
                shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: canSubmit ? 0.3 : 0, shadowRadius: 10, elevation: canSubmit ? 5 : 0 }}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> :
                <Text style={{ fontSize: 16, fontWeight: '700', color: canSubmit ? '#FFFFFF' : '#93C5FD' }}>Tiếp tục →</Text>}
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 28, gap: 6 }}>
            <Text style={{ color: '#8E9BAB', fontSize: 14 }}>Đã có tài khoản?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={{ color: '#0EA5E9', fontSize: 14, fontWeight: '700' }}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
