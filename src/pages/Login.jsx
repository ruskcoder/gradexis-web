import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, GraduationCap, KeyRound, Link2, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
  ItemSubtitle,
  ItemGroup,
} from '@/components/ui/item';
import { Input } from '@/components/ui/input';
import '@/assets/css/login.css';
import Wallpaper from '@/assets/wallpaper.jpg';
import {
  CLASSLINK_LAUNCHPAD_BASE,
  classlinkCodeFromLink,
  DISTRICTS_URL,
  PLATFORMS,
  PLATFORM_MAPPING,
} from '@/lib/constants';
import { fetchDistrictDetails, login } from '@/lib/grades-api';
import { useStore } from '@/lib/store';
import { showWebNotificationsForUser, fetchReferralData } from '@/App';
import MfaPrompt from '@/components/custom/mfa-prompt';

const PLATFORM_ICONS = {
  hac: School,
  'skyward-legacy': GraduationCap,
  powerschool: Building2,
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isReauth = searchParams.get('reason') === 'password_expired';

  // --- Wizard navigation -----------------------------------------------------
  const [step, setStep] = useState(isReauth ? 'form' : 'entry');
  const [dir, setDir] = useState(1);
  const historyRef = useRef([]);

  const go = (next) => {
    historyRef.current.push(step);
    setDir(1);
    setStep(next);
  };
  const back = () => {
    const prev = historyRef.current.pop();
    setDir(-1);
    setStep(prev ?? 'entry');
  };

  // --- Selection / form state ------------------------------------------------
  const [platform, setPlatform] = useState(searchParams.get('platform') || 'hac');
  const [loginType, setLoginType] = useState(searchParams.get('loginType') || 'credentials');
  const [fromCustom, setFromCustom] = useState(false);
  const [districtName, setDistrictName] = useState(searchParams.get('district') || '');
  const [link, setLink] = useState(searchParams.get('link') || '');
  const [code, setCode] = useState(searchParams.get('code') || '');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    isReauth ? 'Your password or 2FA has changed. Please log in again.' : null
  );

  // Custom HAC "fetch details" state.
  const [detailsFetched, setDetailsFetched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [districtOptions, setDistrictOptions] = useState([]);

  // District list.
  const [search, setSearch] = useState('');
  const [districts, setDistricts] = useState([]);

  // Multi-student accounts (e.g. a PowerSchool parent).
  const [students, setStudents] = useState([]);
  const [pendingLogin, setPendingLogin] = useState(null);
  const [pendingMfa, setPendingMfa] = useState('');

  // 2FA prompt.
  const [mfaOpen, setMfaOpen] = useState(false);
  const [mfaType, setMfaType] = useState('pin');
  const [mfaIcons, setMfaIcons] = useState([]);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState(null);

  useEffect(() => {
    setTimeout(() => document.documentElement.classList.remove('dark'), 0);
  }, []);

  useEffect(() => {
    const prefillUsername = searchParams.get('username');
    if (prefillUsername) setUsername(decodeURIComponent(prefillUsername));
  }, [searchParams]);

  useEffect(() => {
    fetch(DISTRICTS_URL)
      .then((res) => res.json())
      .then(setDistricts)
      .catch((err) => console.error('Failed to load districts:', err));
  }, []);

  // --- Animated viewport height (adapts to the active step) ------------------
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  useLayoutEffect(() => {
    if (viewportRef.current && contentRef.current) {
      viewportRef.current.style.height = contentRef.current.offsetHeight + 'px';
    }
  });

  const filteredDistricts = districts.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (d.name || '').toLowerCase().includes(q) ||
      (d.platform || '').toLowerCase().includes(q) ||
      (d.link || '').toLowerCase().includes(q)
    );
  });

  const selectDistrict = (d) => {
    setPlatform(d.platform || 'hac');
    const lt = d.loginType || 'credentials';
    setLoginType(lt);
    setDistrictName(d.name);
    setLink(d.link);
    setCode(lt === 'classlinkCredentials' ? classlinkCodeFromLink(d.link) : '');
    setFromCustom(false);
    setDetailsFetched(true);
    setDistrictOptions([]);
    setUsername('');
    setPassword('');
    setError(null);
    go('form');
    setTimeout(() => setSearch(''), 400);
  };

  const pickPlatform = (p) => {
    setPlatform(p);
    go('custom-source');
  };

  const pickSource = (source) => {
    setLoginType(source === 'classlink' ? 'classlinkCredentials' : 'credentials');
    setFromCustom(true);
    setDistrictName('');
    setLink('');
    setCode('');
    setUsername('');
    setPassword('');
    setDetailsFetched(false);
    setDistrictOptions([]);
    setError(null);
    go('form');
  };

  const doFetchDetails = async () => {
    if (!link.trim()) return;
    setFetching(true);
    setError(null);
    const res = await fetchDistrictDetails(platform, link.trim());
    setDistrictOptions(res.districts);
    if (res.multiple && res.districts[0]) setDistrictName(res.districts[0].name);
    setDetailsFetched(true);
    setFetching(false);
  };

  /**
   * Persist the authenticated user and enter the app. `chosen` is the picked
   * student for multi-student accounts (or null); `answeredMfa` is the ClassLink
   * 2FA answer to store for silent re-auth (or '').
   */
  const commitUser = async (data, chosen, answeredMfa) => {
    const existingUsers = useStore.getState().users;
    const existingUserIndex = existingUsers.findIndex(
      (u) => u.username === (data.username || username)
    );

    const studentId = chosen?.id || data.studentId || '';
    const displayName = chosen?.name || data.name || '';
    const resolvedCode =
      loginType === 'classlinkCredentials' ? code || classlinkCodeFromLink(link) : '';

    let userIndex;
    if (isReauth && existingUserIndex !== -1) {
      userIndex = existingUserIndex;
      useStore.getState().setCurrentUserIndex(userIndex);
      useStore.getState().changeUserData('password', password);
      useStore.getState().changeUserData('clMFA', answeredMfa);
      useStore.getState().changeUserData('mfaType', answeredMfa ? mfaType : '');
      useStore.getState().changeUserData('code', resolvedCode);
      if (data.link) useStore.getState().changeUserData('link', data.link);
      if (studentId) useStore.getState().changeUserData('studentId', studentId);
    } else {
      const avatar = (displayName || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => (n[0] || '').toUpperCase())
        .join('');
      useStore.getState().addUser({
        loginType,
        username: data.username || username,
        password,
        platform,
        link: data.link || link,
        code: resolvedCode,
        clMFA: answeredMfa,
        mfaType: answeredMfa ? mfaType : '',
        school: data.school || '',
        district: data.district || districtName,
        name: displayName,
        avatar: avatar || '',
        premium: data.numReferrals >= 0,
        studentId,
        students: data.students || [],
      });
      userIndex = Math.max(0, useStore.getState().users.length - 1);
      useStore.getState().setCurrentUserIndex(userIndex);
    }

    const newUser = useStore.getState().users[userIndex];
    try {
      showWebNotificationsForUser(newUser, true);
    } catch (_) {}
    await fetchReferralData(newUser, useStore.getState().changeUserData);

    setMfaOpen(false);
    navigate('/dashboard');
  };

  const selectStudent = async (student) => {
    setLoading(true);
    try {
      await commitUser(pendingLogin, student, pendingMfa);
    } catch (e) {
      console.error('Student selection failed:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const doLogin = async (answeredMfa = '') => {
    setError(null);
    if (answeredMfa) {
      setMfaLoading(true);
      setMfaError(null);
    } else {
      setLoading(true);
    }

    try {
      const details = { username, password };
      if (loginType === 'classlinkCredentials') {
        details.code = code || classlinkCodeFromLink(link);
        details.link = '';
        if (answeredMfa) details.clMFA = answeredMfa;
      } else {
        details.link = link;
        details.clsession = '';
        if (districtName) details.district = districtName;
      }

      const data = await login(platform, loginType, details, '');

      if (data?.mfaRequired) {
        setMfaType(data.mfaType === 'image' ? 'image' : 'pin');
        setMfaIcons(data.icons || []);
        setMfaOpen(true);
        return;
      }

      if (data?.success) {
        // Multi-student parent: pause on the picker (fresh logins only).
        if (!isReauth && Array.isArray(data.students) && data.students.length > 1) {
          setPendingLogin(data);
          setPendingMfa(answeredMfa);
          setStudents(data.students);
          setMfaOpen(false);
          go('student-picker');
          return;
        }
        await commitUser(data, null, answeredMfa);
      } else {
        setError('Login failed');
      }
    } catch (e) {
      if (answeredMfa) setMfaError(e.message || 'Verification failed');
      else setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
      setMfaLoading(false);
    }
  };

  const isClassLink = loginType === 'classlinkCredentials';
  const needsFetch = fromCustom && loginType === 'credentials';
  const showCredentials = !needsFetch || detailsFetched;
  const canSubmit =
    !loading && !!username && !!password && (isClassLink ? !!(code || link) : true);

  const renderStep = () => {
    switch (step) {
      case 'entry':
        return (
          <div className="w-full">
            <Button variant="outline" className="w-full mb-2" onClick={() => go('district-list')}>
              Select District
            </Button>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" disabled>
                Demo
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => go('custom-platform')}>
                Custom
              </Button>
            </div>
          </div>
        );

      case 'district-list':
        return (
          <div className="w-full">
            <Input
              type="text"
              placeholder="Search District..."
              className="mb-4 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ItemGroup className="gap-2 max-h-[300px] overflow-y-auto overflow-x-clip w-full">
              {filteredDistricts.map((d, index) => (
                <Item
                  variant="outline"
                  key={index}
                  className="cursor-pointer mr-1"
                  onClick={() => selectDistrict(d)}
                >
                  <ItemContent>
                    <ItemHeader>
                      <ItemTitle className="w-auto">{d.name}</ItemTitle>
                      <ItemSubtitle>{PLATFORM_MAPPING[d.platform]}</ItemSubtitle>
                    </ItemHeader>
                    <ItemDescription>{d.link}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
              {filteredDistricts.length === 0 && (
                <p className="text-gray-500 text-center w-full py-2">No districts found.</p>
              )}
            </ItemGroup>
            <div className="mt-4 w-full">
              <Button type="button" variant="outline" onClick={back} className="w-full">
                Back
              </Button>
            </div>
          </div>
        );

      case 'custom-platform':
        return (
          <div className="w-full">
            <p className="text-center text-sm font-medium mb-3">Choose your platform</p>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map((p) => {
                const Icon = PLATFORM_ICONS[p] || School;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => pickPlatform(p)}
                    className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border bg-white/60 p-3 transition hover:bg-white/90"
                  >
                    <Icon className="h-7 w-7" />
                    <span className="text-sm font-medium text-center">
                      {PLATFORM_MAPPING[p] ?? p}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 w-full">
              <Button type="button" variant="outline" onClick={back} className="w-full">
                Back
              </Button>
            </div>
          </div>
        );

      case 'custom-source':
        return (
          <div className="w-full">
            <p className="text-center text-sm font-medium mb-3">Choose your login source</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => pickSource('credentials')}
                className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border bg-white/60 p-3 transition hover:bg-white/90"
              >
                <KeyRound className="h-7 w-7" />
                <span className="text-sm font-medium">Credentials</span>
              </button>
              <button
                type="button"
                onClick={() => pickSource('classlink')}
                className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border bg-white/60 p-3 transition hover:bg-white/90"
              >
                <Link2 className="h-7 w-7" />
                <span className="text-sm font-medium">ClassLink</span>
              </button>
            </div>
            <div className="mt-4 w-full">
              <Button type="button" variant="outline" onClick={back} className="w-full">
                Back
              </Button>
            </div>
          </div>
        );

      case 'form':
        return (
          <div className="w-full">
            {!fromCustom && districtName ? (
              <Item variant="outline" className="mb-4 w-full">
                <ItemContent>
                  <ItemHeader>
                    <ItemTitle className="w-auto">{districtName}</ItemTitle>
                    <ItemSubtitle>{PLATFORM_MAPPING[platform]}</ItemSubtitle>
                  </ItemHeader>
                  <ItemDescription>{link}</ItemDescription>
                </ItemContent>
              </Item>
            ) : (
              <Item variant="outline" className="mb-4 w-full">
                <ItemContent>
                  <ItemHeader>
                    <ItemTitle className="w-auto">{PLATFORM_MAPPING[platform] ?? platform}</ItemTitle>
                    <ItemSubtitle>{isClassLink ? 'ClassLink' : 'Credentials'}</ItemSubtitle>
                  </ItemHeader>
                </ItemContent>
              </Item>
            )}

            <form
              className="w-full"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) doLogin();
              }}
            >
              <FieldGroup>
                <FieldSet>
                  <FieldGroup className="gap-4">
                    {error && <p className="w-full text-center text-red-500">{error}</p>}

                    {/* ClassLink: launchpad link with a fixed prefix. */}
                    {fromCustom && isClassLink && (
                      <Field>
                        <FieldLabel>District Link</FieldLabel>
                        <div className="flex items-center rounded-md border border-input bg-transparent px-3 h-9 text-sm focus-within:ring-1 focus-within:ring-ring">
                          <span className="text-muted-foreground select-none">
                            {CLASSLINK_LAUNCHPAD_BASE}
                          </span>
                          <input
                            className="flex-1 bg-transparent outline-none"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="katyisd"
                            autoCapitalize="none"
                            autoCorrect="off"
                          />
                        </div>
                      </Field>
                    )}

                    {/* Custom HAC credentials: link + fetch-details gate. */}
                    {needsFetch && (
                      <Field>
                        <FieldLabel>District Link</FieldLabel>
                        <Input
                          type="text"
                          placeholder="homeaccess.example.org"
                          value={link}
                          onChange={(e) => {
                            setLink(e.target.value);
                            setDetailsFetched(false);
                            setDistrictOptions([]);
                          }}
                        />
                        {!detailsFetched && (
                          <Button
                            type="button"
                            className="w-full mt-2"
                            disabled={fetching || !link.trim()}
                            onClick={doFetchDetails}
                          >
                            {fetching && <Spinner />}
                            Fetch details
                          </Button>
                        )}
                      </Field>
                    )}

                    {showCredentials && districtOptions.length > 1 && (
                      <Field>
                        <FieldLabel>District</FieldLabel>
                        <select
                          className="w-full rounded-md border border-input bg-transparent px-3 h-9 text-sm"
                          value={districtName}
                          onChange={(e) => setDistrictName(e.target.value)}
                        >
                          {districtOptions.map((d) => (
                            <option key={d.value} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}

                    {showCredentials && (
                      <>
                        <Field>
                          <FieldLabel>Username</FieldLabel>
                          <Input
                            type="text"
                            value={username}
                            placeholder="Username"
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isReauth}
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Password</FieldLabel>
                          <Input
                            type="password"
                            value={password}
                            placeholder="Password"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </Field>
                      </>
                    )}
                  </FieldGroup>
                </FieldSet>
              </FieldGroup>
              <div className="flex items-center mt-4 gap-2 w-full">
                <Button type="button" variant="outline" onClick={back} disabled={loading}>
                  Back
                </Button>
                {showCredentials && (
                  <Button className="flex-1" type="submit" disabled={!canSubmit}>
                    {loading && <Spinner />}
                    Login
                  </Button>
                )}
              </div>
            </form>
          </div>
        );

      case 'student-picker':
        return (
          <div className="w-full">
            <p className="text-center font-medium mb-1">Choose a student</p>
            <p className="text-center text-sm text-gray-500 mb-4">
              This account has more than one student. Pick who to view.
            </p>
            {error && <p className="w-full text-center text-red-500 mb-2">{error}</p>}
            <ItemGroup className="gap-2 max-h-[300px] overflow-y-auto overflow-x-clip w-full">
              {students.map((student, index) => (
                <Item
                  variant="outline"
                  key={student.id || index}
                  className={'cursor-pointer mr-1' + (loading ? ' pointer-events-none opacity-60' : '')}
                  onClick={() => selectStudent(student)}
                >
                  <ItemContent>
                    <ItemHeader>
                      <ItemTitle className="w-auto">{student.name}</ItemTitle>
                    </ItemHeader>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
            <div className="mt-4 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={back}
                className="w-full"
                disabled={loading}
              >
                Back
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
                    className="block transition-all duration-150 h-[64px] w-[64px] mr-[2px]"
                  >
                    <path d="M242-249q-20-11-31-29.5T200-320v-192l-96-53q-11-6-16-15t-5-20q0-11 5-20t16-15l338-184q9-5 18.5-7.5T480-829q10 0 19.5 2.5T518-819l381 208q10 5 15.5 14.5T920-576v256q0 17-11.5 28.5T880-280q-17 0-28.5-11.5T840-320v-236l-80 44v192q0 23-11 41.5T718-249L518-141q-9 5-18.5 7.5T480-131q-10 0-19.5-2.5T442-141L242-249Zm238-203 274-148-274-148-274 148 274 148Zm0 241 200-108v-151l-161 89q-9 5-19 7.5t-20 2.5q-10 0-20-2.5t-19-7.5l-161-89v151l200 108Zm0-241Zm0 121Zm0 0Z" />
                  </svg>
                </div>
                <span className="text-4xl font-extrabold tracking-tight">Gradexis</span>
              </div>
            </div>

            <div className="login-form width-full mt-6">
              <div ref={viewportRef} className="login-step-viewport">
                <div
                  key={step}
                  ref={contentRef}
                  className={dir === 1 ? 'login-step-forward' : 'login-step-back'}
                >
                  {renderStep()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MfaPrompt
        open={mfaOpen}
        mfaType={mfaType}
        icons={mfaIcons}
        loading={mfaLoading}
        error={mfaError}
        onSubmit={(answer) => doLogin(answer)}
        onCancel={() => {
          setMfaOpen(false);
          setMfaError(null);
        }}
      />
    </div>
  );
}
