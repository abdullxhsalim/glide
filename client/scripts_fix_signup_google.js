const fs = require('fs');

const path = 'client/src/pages/Signup.jsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `            // Save user data
            login(data);
             // Admins bypass signup, but if added later, redirect accordingly.
            navigate('/dash');
        } catch (err) {
            setError(err.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError(null);
        
        // Ensure user has passed basic profile requirements. We will only show Google Button at Step 3 (password step)
        
        setLoading(true);
        try {
            const res = await fetch('/api/users/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    credential: credentialResponse.credential,
                    role: formData.role,
                    studentId: formData.studentId,
                    contactNumber: formData.contactNumber,
                    vehicle: formData.role === 'driver' ? formData.vehicle : undefined
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Google signup failed');

            login(data);
            navigate('/dash');
        } catch (err) {
            setError(err.message || 'Failed to signup with Google');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {`;

content = content.replace(/            \/\/ Save user data\n            login\(data\);\n             \/\/ Admins bypass signup, but if added later, redirect accordingly\.\n            navigate\('\/dash'\);\n        \} catch \(err\) \{\n            setError\(err\.message \|\| 'Failed to register'\);\n        \} finally \{\n            setLoading\(false\);\n        \}\n    \};\n\n    const renderStep = \(\) => \{/g, replacement);

console.log(content.includes('handleGoogleSuccess') ? "Added success handler" : "Failed to add success handler");

const passwordStepMatch = `                        </div>
                    </motion.div>
                );
            case 4:`;

const passwordStepReplacement = `                        </div>
                    </motion.div>
                );
            case 4:`;

// we need a more flexible way to inject the button. Let's do it below the sign in button.
content = content.replace(
`                        {step === totalSteps ? (
                            <button
                                type="submit"
                                disabled={loading}
                                onClick={handleSubmit}
                                className={\`px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-white \$\{
                                    loading 
                                    ? 'bg-[#4F46E5]/50 cursor-not-allowed' 
                                    : 'bg-[#4F46E5] hover:bg-[#4338CA] shadow-[#4F46E5]/30 hover:shadow-[#4F46E5]/50'
                                \}\`}
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>Complete Account <CheckCircle className="w-5 h-5" /></>
                                )}
                            </button>
                        )`,
`                        {step === totalSteps ? (
                            <div className="flex flex-col gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    onClick={handleSubmit}
                                    className={\`px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-white \$\{
                                        loading 
                                        ? 'bg-[#4F46E5]/50 cursor-not-allowed' 
                                        : 'bg-[#4F46E5] hover:bg-[#4338CA] shadow-[#4F46E5]/30 hover:shadow-[#4F46E5]/50'
                                    \}\`}
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <>Complete Account <CheckCircle className="w-5 h-5" /></>
                                    )}
                                </button>

                                <div className="relative my-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-[#334155]" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="bg-[#1E293B] px-2 text-[#94A3B8]">Or continue with</span>
                                    </div>
                                </div>

                                <div className="flex justify-center w-full">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError('Google Signup Failed')}
                                        useOneTap={false}
                                        theme="filled_black"
                                        shape="pill"
                                        size="large"
                                    />
                                </div>
                            </div>
                        )`
);
fs.writeFileSync(path, content);
