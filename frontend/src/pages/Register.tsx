import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthApi, GeoApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const Register = () => {
  const navigate = useNavigate();
  const acceptAuth = useAuthStore(s => s.acceptAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    state: '',
    district: '',
    subdivision: '',
    village: '',
    designation: '',
    password: '',
    confirm_password: '',
    gender: 'Male',
    phone: '',
    address: '',
    captcha: '',
  });

  useEffect(() => {
    GeoApi.states().then(setStates).catch(() => setStates([]));
  }, []);

  useEffect(() => {
    if (selectedStateId) {
      GeoApi.districts(Number(selectedStateId)).then(setDistricts).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
  }, [selectedStateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      const { token, user } = await AuthApi.registerCitizen(payload);
      acceptAuth(user, token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>New User</CardTitle>
            <CardDescription>Register as a citizen to submit and track claims</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label>First name *</Label>
                  <Input value={form.first_name} onChange={e => setForm(f => ({...f, first_name: e.target.value}))} required />
                </div>
                <div>
                  <Label>Last name *</Label>
                  <Input value={form.last_name} onChange={e => setForm(f => ({...f, last_name: e.target.value}))} required />
                </div>
                <div>
                  <Label>Email Id *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
                </div>
                <div>
                  <Label>Username *</Label>
                  <Input value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} required />
                </div>
                <div>
                  <Label>State *</Label>
                  <Select value={selectedStateId} onValueChange={v => { setSelectedStateId(v); const st = states.find(s => String(s.id)===v); setForm(f => ({...f, state: st?.name || ''})); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>District *</Label>
                  <Select value={form.district} onValueChange={v => setForm(f => ({...f, district: v}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map(d => (
                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sub Division *</Label>
                  <Input value={form.subdivision} onChange={e => setForm(f => ({...f, subdivision: e.target.value}))} required />
                </div>
                <div>
                  <Label>Village *</Label>
                  <Input value={form.village} onChange={e => setForm(f => ({...f, village: e.target.value}))} required />
                </div>
                <div>
                  <Label>Designation</Label>
                  <Input value={form.designation} onChange={e => setForm(f => ({...f, designation: e.target.value}))} />
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
                </div>
                <div>
                  <Label>Confirm Password *</Label>
                  <Input type="password" value={form.confirm_password} onChange={e => setForm(f => ({...f, confirm_password: e.target.value}))} required />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm(f => ({...f, gender: v}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mobile *</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} required />
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} />
                </div>
                <div>
                  <Label>Captcha</Label>
                  <Input value={form.captcha} onChange={e => setForm(f => ({...f, captcha: e.target.value}))} />
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex items-center justify-between">
                <Button type="reset" variant="outline" onClick={() => { setForm({
                  first_name:'',last_name:'',email:'',username:'',state:'',district:'',subdivision:'',village:'',designation:'',password:'',confirm_password:'',gender:'Male',phone:'',address:'',captcha:''
                }); setSelectedStateId(''); setDistricts([]); }}>Reset</Button>
                <div className="space-x-2">
                  <Button asChild variant="ghost"><Link to="/login">Back to Login</Link></Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Register;
