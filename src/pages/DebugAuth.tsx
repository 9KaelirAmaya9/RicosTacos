import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const DebugAuth = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<Record<string, 'success' | 'error' | 'warning'>>({});

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    const setResult = (key: string, status: 'success' | 'error' | 'warning') =>
        setResults(prev => ({ ...prev, [key]: status }));

    const runDiagnostics = async () => {
        setIsRunning(true);
        setLogs([]);
        setResults({});
        addLog("Starting diagnostics...");

        try {
            // 1. Check Session
            addLog("Checking session...");
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                addLog(`Session Error: ${sessionError.message}`);
                setResult('session', 'error');
            } else if (!session) {
                addLog("No active session found.");
                setResult('session', 'warning');
            } else {
                addLog(`Session found for user: ${session.user.id}`);
                setResult('session', 'success');

                // 2. Check User Roles (Direct)
                addLog("Checking user_roles table (Direct)...");
                const startDirect = performance.now();
                try {
                    const { data: roles, error: rolesError } = await supabase
                        .from("user_roles")
                        .select("*")
                        .eq("user_id", session.user.id)
                        .timeout(5000); // 5s timeout

                    const endDirect = performance.now();
                    addLog(`Direct query took ${(endDirect - startDirect).toFixed(2)}ms`);

                    if (rolesError) {
                        addLog(`Direct Query Error: ${rolesError.message}`);
                        setResult('roles_direct', 'error');
                    } else {
                        addLog(`Roles found: ${JSON.stringify(roles)}`);
                        setResult('roles_direct', 'success');
                    }
                } catch (e: any) {
                    addLog(`Direct Query Exception (Timeout?): ${e.message}`);
                    setResult('roles_direct', 'error');
                }

                // 3. Check User Roles (RPC)
                addLog("Checking has_role RPC...");
                const startRpc = performance.now();
                try {
                    const { data: isAdmin, error: rpcError } = await supabase.rpc('has_role', {
                        _user_id: session.user.id,
                        _role: 'admin'
                    });

                    const endRpc = performance.now();
                    addLog(`RPC query took ${(endRpc - startRpc).toFixed(2)}ms`);

                    if (rpcError) {
                        addLog(`RPC Error: ${rpcError.message}`);
                        setResult('roles_rpc', 'error');
                    } else {
                        addLog(`Is Admin (RPC): ${isAdmin}`);
                        setResult('roles_rpc', 'success');
                    }
                } catch (e: any) {
                    addLog(`RPC Exception: ${e.message}`);
                    setResult('roles_rpc', 'error');
                }

                // 4. Check Orders Access
                addLog("Checking orders table access...");
                try {
                    const { count, error: ordersError } = await supabase
                        .from("orders")
                        .select("*", { count: 'exact', head: true })
                        .timeout(5000);

                    if (ordersError) {
                        addLog(`Orders Access Error: ${ordersError.message}`);
                        setResult('orders', 'error');
                    } else {
                        addLog(`Orders count accessible: ${count}`);
                        setResult('orders', 'success');
                    }
                } catch (e: any) {
                    addLog(`Orders Access Exception: ${e.message}`);
                    setResult('orders', 'error');
                }
            }

        } catch (e: any) {
            addLog(`Critical Failure: ${e.message}`);
        } finally {
            setIsRunning(false);
            addLog("Diagnostics complete.");
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Auth Diagnostics</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Controls</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={runDiagnostics} disabled={isRunning} className="w-full">
                            {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Run Diagnostics
                        </Button>

                        <div className="mt-6 space-y-4">
                            <ResultItem label="Session Check" status={results.session} />
                            <ResultItem label="User Roles (Direct)" status={results.roles_direct} />
                            <ResultItem label="User Roles (RPC)" status={results.roles_rpc} />
                            <ResultItem label="Orders Access" status={results.orders} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-[500px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Logs</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto bg-muted/50 p-4 rounded-md font-mono text-xs">
                        {logs.length === 0 ? (
                            <span className="text-muted-foreground">Ready to start...</span>
                        ) : (
                            logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const ResultItem = ({ label, status }: { label: string, status?: 'success' | 'error' | 'warning' }) => {
    let icon = <div className="w-5 h-5 rounded-full border-2 border-muted" />;
    let color = "text-muted-foreground";

    if (status === 'success') {
        icon = <CheckCircle className="w-5 h-5 text-green-500" />;
        color = "text-foreground";
    } else if (status === 'error') {
        icon = <XCircle className="w-5 h-5 text-red-500" />;
        color = "text-red-500 font-medium";
    } else if (status === 'warning') {
        icon = <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        color = "text-yellow-600";
    }

    return (
        <div className="flex items-center justify-between p-2 border rounded bg-background">
            <span className={color}>{label}</span>
            {icon}
        </div>
    );
};

export default DebugAuth;
