'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { hashPassword } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

interface User {
  id: number
  email: string
  role: 'admin' | 'driver' | 'supervisor'
  driver_id?: number
  created_at?: string
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    role: 'supervisor' as 'admin' | 'driver' | 'supervisor',
    driver_id: null as number | null
  })

  useEffect(() => {
    fetchUsers()
    fetchDrivers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, driver_id, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, name')
        .order('name')

      if (error) throw error
      setDrivers(data || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const handleAddUser = async () => {
    if (!userForm.email || !userForm.password) {
      alert('Email and password are required')
      return
    }

    if (userForm.role === 'driver' && !userForm.driver_id) {
      alert('Please select a driver')
      return
    }

    try {
      const passwordHash = await hashPassword(userForm.password)

      const { error } = await supabase
        .from('users')
        .insert([{
          email: userForm.email,
          password_hash: passwordHash,
          role: userForm.role,
          driver_id: userForm.role === 'driver' ? userForm.driver_id : null
        }])

      if (error) throw error

      alert('User created successfully!')
      setUserForm({ email: '', password: '', role: 'supervisor', driver_id: null })
      setIsAdding(false)
      fetchUsers()
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert(error.message || 'Failed to create user')
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const updates: any = {
        email: userForm.email,
        role: userForm.role,
        driver_id: userForm.role === 'driver' ? userForm.driver_id : null
      }

      if (userForm.password) {
        updates.password_hash = await hashPassword(userForm.password)
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', editingUser.id)

      if (error) throw error

      alert('User updated successfully!')
      setUserForm({ email: '', password: '', role: 'supervisor', driver_id: null })
      setEditingUser(null)
      fetchUsers()
    } catch (error: any) {
      console.error('Error updating user:', error)
      alert(error.message || 'Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      alert('User deleted successfully!')
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(error.message || 'Failed to delete user')
    }
  }

  const startEdit = (user: User) => {
    setEditingUser(user)
    setUserForm({
      email: user.email,
      password: '',
      role: user.role,
      driver_id: user.driver_id || null
    })
    setIsAdding(false)
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setIsAdding(false)
    setUserForm({ email: '', password: '', role: 'supervisor', driver_id: null })
    setShowPassword(false)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'supervisor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'driver': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getDriverName = (driverId: number | undefined) => {
    if (!driverId) return '—'
    const driver = drivers.find(d => d.id === driverId)
    return driver?.name || '—'
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/settings')}
            className="hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground">Create and manage system user accounts</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>System Users</CardTitle>
                <CardDescription>Manage user accounts and assign roles</CardDescription>
              </div>
              <Button onClick={() => { setIsAdding(true); setEditingUser(null) }}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(isAdding || editingUser) && (
              <div className="mb-6 p-4 border border-primary/50 rounded-lg bg-muted/30 space-y-4">
                <h3 className="font-semibold text-foreground">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user-email">Email *</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="user@example.com"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-password">
                      Password {editingUser && '(leave blank to keep current)'}
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="user-password"
                        type={showPassword ? 'text' : 'password'}
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="user-role">Role *</Label>
                    <Select
                      value={userForm.role}
                      onValueChange={(value: any) => setUserForm({ ...userForm, role: value, driver_id: value === 'driver' ? userForm.driver_id : null })}
                    >
                      <SelectTrigger id="user-role" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {userForm.role === 'driver' && (
                    <div>
                      <Label htmlFor="user-driver">Link to Driver *</Label>
                      <Select
                        value={userForm.driver_id?.toString() || ''}
                        onValueChange={(value) => setUserForm({ ...userForm, driver_id: parseInt(value) })}
                      >
                        <SelectTrigger id="user-driver" className="mt-2">
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id.toString()}>
                              {driver.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={editingUser ? handleUpdateUser : handleAddUser}>
                    {editingUser ? 'Update User' : 'Create User'}
                  </Button>
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found. Click "Add User" to create one.
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow className="border-border">
                      <TableHead className="text-foreground">Email</TableHead>
                      <TableHead className="text-foreground">Role</TableHead>
                      <TableHead className="text-foreground">Linked Driver</TableHead>
                      <TableHead className="text-foreground">Created</TableHead>
                      <TableHead className="text-right text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-border">
                        <TableCell className="font-medium text-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">{getDriverName(user.driver_id)}</TableCell>
                        <TableCell className="text-foreground">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(user)}
                              className="hover:bg-muted"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
