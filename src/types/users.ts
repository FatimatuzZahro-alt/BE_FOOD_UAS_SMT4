export interface CreateUser {
    name: string;
    email: string;
    password: string;

}

export interface UpdatedUser {
    name?: string;
    email?: string;
    password?: string;
} 