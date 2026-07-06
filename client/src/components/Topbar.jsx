import React, { useState } from 'react'
import LiveClock from './LiveClock'
import { Link } from 'react-router'
import {
  TbLogout,
  TbUserSquareRounded,
  TbChevronDown,
  TbMenu2
} from 'react-icons/tb'
import { useUserContext } from '../contexts/UserContext'
import { useUIContext } from '../contexts/UIContext'
import LogoutModal from './modals/LogoutModal'
import clsx from 'clsx'
import { getAvatarColor } from '../utils/avatarColors'

function TopBar () {
  const { userData } = useUserContext()
  const { setIsSideBarOpen } = useUIContext()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  const displayName = userData.data._id
    ? `${userData.data.firstname} ${userData.data.lastname}`
    : ''

  console.log(userData?.data?.role)

  const displayRole =
    userData.data.role !== 'subcon'
      ? userData?.data?.role?.replace('_', ' ')
      : userData?.data?.subcon?.replace('_', ' ')

  const initials = userData.data._id
    ? `${userData.data.firstname?.[0] ?? ''}${
        userData.data.lastname?.[0] ?? ''
      }`.toUpperCase()
    : '?'

  const hasImage = !!userData?.data?.imageUrl
  const avatarColor = getAvatarColor(displayName)

  return (
    <>
      <header className='h-[46px] md:h-[60px] flex items-center px-5 sm:px-7 shrink-0 z-30 bg-white md:border-b border-gray-100 md:shadow-sm'>
        {/* ── Left: Hamburger (mobile only) + Clock ────────────────────── */}
        <div className='flex items-center gap-3 -ml-1'>
          <button
            onClick={() => setIsSideBarOpen(p => !p)}
            className={clsx(
              'lg:hidden flex items-center justify-center w-8 h-8 rounded-md cursor-pointer',
              'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
              'transition-[background,color] duration-150'
            )}
          >
            <TbMenu2 size={18} />
          </button>
          <LiveClock />
        </div>

        {/* ── Right: User profile ───────────────────────────────────────── */}
        <div className='ml-auto dropdown'>
          {/* Mobile: avatar only */}
          <div
            tabIndex={0}
            role='button'
            className='relative shrink-0 cursor-pointer md:hidden'
          >
            {hasImage ? (
              <img
                src={userData.data.imageUrl}
                className='w-8 h-8 rounded-md object-cover object-center border border-gray-200'
              />
            ) : (
              <div
                className={clsx(
                  'w-8 h-8 rounded-md flex items-center justify-center',
                  avatarColor.bg,
                  avatarColor.border
                )}
              >
                <span
                  className={clsx(
                    'text-[11px] font-bold leading-none',
                    avatarColor.text
                  )}
                >
                  {initials}
                </span>
              </div>
            )}
            <span className='absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white' />
          </div>

          {/* Desktop: full pill */}
          <div
            tabIndex={0}
            role='button'
            className={clsx(
              'hidden md:flex items-center gap-2.5 cursor-pointer rounded-md px-2.5 py-1.5',
              'border border-gray-200 bg-gray-50',
              'hover:bg-gray-100 hover:border-gray-300',
              'transition-[background,border-color] duration-150'
            )}
          >
            {/* Avatar */}
            <div className='relative shrink-0'>
              {hasImage ? (
                <img
                  src={userData.data.imageUrl}
                  className='w-7 h-7 rounded-md object-cover object-center'
                />
              ) : (
                <div
                  className={clsx(
                    'w-7 h-7 rounded-md flex items-center justify-center',
                    avatarColor.bg,
                    avatarColor.border
                  )}
                >
                  <span
                    className={clsx(
                      'text-[10px] font-bold leading-none',
                      avatarColor.text
                    )}
                  >
                    {initials}
                  </span>
                </div>
              )}
              <span className='absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white' />
            </div>

            {/* Name + role */}
            <div className='flex flex-col leading-none'>
              <p className='text-[12.5px] font-semibold text-gray-800 capitalize whitespace-nowrap max-w-[120px] truncate'>
                {displayName}
              </p>
              <span className='text-xxs text-gray-400 capitalize mt-0.5 whitespace-nowrap'>
                {displayRole}
              </span>
            </div>

            <TbChevronDown className='text-gray-400 w-3.5 h-3.5 ml-0.5 shrink-0' />
          </div>

          {/* ── Dropdown ─────────────────────────────────────────────────── */}
          <ul
            tabIndex={0}
            className={clsx(
              'dropdown-content right-0 mt-2 p-1.5 w-52',
              'bg-white border border-gray-100 rounded-md',
              'shadow-md'
            )}
          >
            <li>
              <Link
                to='/secure/my-profile'
                className={clsx(
                  'flex gap-2.5 items-center px-3 py-2 rounded-md',
                  'text-gray-500 hover:text-gray-800 hover:bg-gray-50',
                  'transition-[background,color] duration-150'
                )}
              >
                <TbUserSquareRounded className='text-[16px] shrink-0' />
                <p className='text-[12.5px]'>My Profile</p>
              </Link>
            </li>
            <li>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className={clsx(
                  'w-full flex gap-2.5 items-center px-3 py-2 rounded-md',
                  'text-red-400 hover:text-red-500 hover:bg-red-50',
                  'transition-[background,color] duration-150'
                )}
              >
                <TbLogout className='text-[16px] shrink-0' />
                <p className='text-[12.5px]'>Logout</p>
              </button>
            </li>
          </ul>
        </div>
      </header>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  )
}

export default TopBar
