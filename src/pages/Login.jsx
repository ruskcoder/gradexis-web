import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemMedia,
  ItemTitle,
  ItemSubtitle,
  ItemGroup,
  ItemSeparator,
} from "@/components/ui/item";
import { Input } from '@/components/ui/input';
import '@/assets/css/login.css';
import Wallpaper from '@/assets/wallpaper.jpg';
import Logo from '@/assets/img/logo-rounded.png';
import { districts, PLATFORM_MAPPING } from '@/lib/constants';
import { login } from '@/lib/grades-api';
import { useStore } from '@/lib/store';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('credentials');
  const [district, setDistrict] = useState(null);
  const [link, setLink] = useState('');
  const [platform, setPlatform] = useState('');
  const [clsession, setClsession] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const navigate = useNavigate();
 
  const addUser = useStore((state) => state.addUser);
  const setCurrentUserIndex = useStore((state) => state.setCurrentUserIndex);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loginDetails = {
        username,
        password,
        link,
      };
      const data = await login(platform, loginType, loginDetails, referralCode);
      console.log('Login successful:', data);

      if (data && data.success) {
        let avatar = ((data.name || '').split(/\s+/).filter(Boolean).slice(0,2).map(n => (n[0] || '').toUpperCase()).join(''))
        addUser({
          loginType,
          username: data.username || username,
          password,
          platform,
          school: data.school || '',
          district: data.district,
          link: data.link || link,
          name: data.name || '',
          avatar: avatar || '',
        });

        const users = useStore.getState().users;
        setCurrentUserIndex(Math.max(0, users.length - 1));

        navigate('/dashboard');
      } else {
        setError('Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const [page, setPage] = useState(0);
  const changePage = (page) => {
    setPage(page);
    const inner = document.querySelector('.login-inner');
    if (inner) {
      inner.style.transform = `translateX(calc(-${page * 100}% - calc(calc(var(--spacing) * 6) * ${page})))`;
    }
    inner.style.maxHeight = inner.querySelectorAll('.login-page')[page].offsetHeight + 'px';
    setTimeout(() => {
      setSearch('');
    }, 500);
  }

  const selectDistrict = (district) => {
    setDistrict(district.name);
    setLink(district.link);
    setPlatform(district.platform);
    setLoginType(district.logintype);
    setTimeout(() => {
      changePage(2);
    }, 0);
  }

  useEffect(() => {
    changePage(0);
    document.documentElement.classList.remove('dark');
  }, []); 

  const filteredDistricts = districts.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (d.name || '').toLowerCase().includes(q) ||
      (d.platform || '').toLowerCase().includes(q) ||
      (d.link || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const inner = document.querySelector('.login-inner');
    if (inner) {
      inner.style.maxHeight = inner.querySelectorAll('.login-page')[page].offsetHeight + 'px';
      inner.style.height = inner.querySelectorAll('.login-page')[page].offsetHeight + 'px';
    }
  }, [filteredDistricts, error]);

  return (
    <div className="min-h-screen relative overflow-hidden overscroll-none">
      <img
        src={Wallpaper}
        alt="Wallpaper"
        className="fixed inset-0 w-full h-full object-cover -z-10"
        fetchPriority="high"
      />
      
      <div className="login-mobile-blur" />

      <div className="absolute right-0 top-0 h-full w-5/6 flex items-center justify-center pl-[calc(100vw/3)] max-sm:fixed max-sm:left-0 max-sm:top-0 max-sm:h-screen max-sm:w-full max-sm:pl-0 max-sm:z-10 max-sm:justify-center">
        <div className="absolute inset-0 login-gradient max-sm:hidden" />

        <div className="relative z-10 w-full max-w-md p-8">
          <div className="bg-white/40 rounded-2xl p-6 shadow-sm border overflow-clip">
            <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-4">
                <div className="bg-[#9cd0fb] rounded-xl aspect-square p-1 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 -960 960 960"
                    fill="#103074"
                    className={"block transition-all duration-150 h-[64px] w-[64px] mr-[2px]"}
                  >
                    <path d="M242-249q-20-11-31-29.5T200-320v-192l-96-53q-11-6-16-15t-5-20q0-11 5-20t16-15l338-184q9-5 18.5-7.5T480-829q10 0 19.5 2.5T518-819l381 208q10 5 15.5 14.5T920-576v256q0 17-11.5 28.5T880-280q-17 0-28.5-11.5T840-320v-236l-80 44v192q0 23-11 41.5T718-249L518-141q-9 5-18.5 7.5T480-131q-10 0-19.5-2.5T442-141L242-249Zm238-203 274-148-274-148-274 148 274 148Zm0 241 200-108v-151l-161 89q-9 5-19 7.5t-20 2.5q-10 0-20-2.5t-19-7.5l-161-89v151l200 108Zm0-241Zm0 121Zm0 0Z" />
                  </svg>
                </div>
                <span className="text-4xl font-extrabold tracking-tight">Gradexis</span>
              </div>
            </div>

            <div className='login-form width-full mt-6'>
              <div className="login-inner w-full flex flex-row flex-nowrap gap-6 transition-all duration-500">
                <div className='login-page'>
                  <Button variant="outline" className="w-full mb-2" onClick={() => changePage(1)}>
                    Select District
                  </Button>
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" className="flex-1" disabled>
                      Demo
                    </Button>
                    <Button variant="outline" className="flex-1" disabled>
                      Custom
                    </Button>
                  </div>
                </div>
                <div className="login-page">
                  <Input
                    type="text"
                    placeholder="Search District..."
                    className="mb-4 w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <ItemGroup className="gap-2 max-h-[300px] overflow-y-auto overflow-x-clip w-full">
                    {filteredDistricts.map((district, index) => (
                      <Item variant="outline" key={index} className="cursor-pointer" onClick={() => selectDistrict(district)}>
                        <ItemContent>
                          <ItemHeader>
                            <ItemTitle>
                              {district.name}
                            </ItemTitle>
                            <ItemSubtitle>
                              {PLATFORM_MAPPING[district.platform]}
                            </ItemSubtitle>
                          </ItemHeader>
                          <ItemDescription>{district.link}</ItemDescription>
                        </ItemContent>
                      </Item>
                    ))}
                    {filteredDistricts.length === 0 && (
                      <p className="text-gray-500 text-center w-full py-2">No districts found.</p>
                    )}
                  </ItemGroup>

                  <div className="mt-4 w-full">
                    <Button type="button" variant="outline" onClick={() => changePage(0)} className="w-full" disabled={page !== 1}>
                      Back
                    </Button>
                  </div>
                </div>
                <div className="login-page">
                  <Item variant="outline" className="mb-4 w-full">
                    <ItemContent>
                      <ItemHeader>
                        <ItemTitle>
                          {district}
                        </ItemTitle>
                        <ItemSubtitle>
                          {PLATFORM_MAPPING[platform]}
                        </ItemSubtitle>
                      </ItemHeader>
                      <ItemDescription>{link}</ItemDescription>
                    </ItemContent>
                  </Item>
                  <form className="w-full" onSubmit={handleLogin}>
                    <FieldGroup>
                      <FieldSet disabled={page !== 2}>
                        <FieldGroup className="gap-4">
                          {error && <p className="w-full text-center text-red-500">{error}</p>}
                          <Field>
                            <FieldLabel>Username</FieldLabel>
                            <Input
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              required
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Password</FieldLabel>
                            <Input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Referral Code</FieldLabel>
                            <Input
                              type="text"
                              placeholder="Referral Code (Optional)"
                              value={referralCode}
                              onChange={(e) => setReferralCode(e.target.value)}
                            />
                          </Field>
                        </FieldGroup>
                      </FieldSet>
                    </FieldGroup>
                    <div className="flex items-center mt-4 gap-2 w-full">
                      <Button type="button" variant="outline" onClick={() => changePage(1)} disabled={loading}>Back</Button>
                      <Button className="flex-1" type="submit" 
                        disabled={loading || (loginType === 'classlink' && !clsession) || (loginType === 'credentials' && (!username || !password))}
                      >
                        {loading && <Spinner />}
                        Login
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
