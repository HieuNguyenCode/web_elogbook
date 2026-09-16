export function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function getUserRole(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const decoded = parseJwt(token);
    if (!decoded) return null;
    
    // In .NET, the role claim is often "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    // or just "role" depending on JwtSecurityTokenHandler configuration.
    return decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || decoded.Role || null;
}
